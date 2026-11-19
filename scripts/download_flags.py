
import argparse
import json
import random
import re
import sys
import time
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote

import requests

# Resolve all paths relative to the project root.
PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "src" / "data" / "countries.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "flags"
ATTRIBUTION_FILE = OUTPUT_DIR / "ATTRIBUTION.md"

BASE_URL = "https://commons.wikimedia.org/wiki/Special:FilePath/"
API_URL = "https://commons.wikimedia.org/w/api.php"

HEADERS = {
    "User-Agent": "CountryQuiz/1.0 (personal educational project)"
}

DELAY_SECONDS = 1.0
MAX_ATTEMPTS = 5
TIMEOUT_SECONDS = 30
API_BATCH_SIZE = 50

session = requests.Session()
session.headers.update(HEADERS)


class HTMLTextExtractor(HTMLParser):
    """Extract readable text from HTML metadata values."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def get_text(self):
        return " ".join(" ".join(self.parts).split())


def clean_metadata(value):
    """Convert a Commons metadata value into plain text."""

    if not value:
        return ""

    if not isinstance(value, str):
        value = str(value)

    parser = HTMLTextExtractor()
    parser.feed(unescape(value))

    return parser.get_text().strip()


def get_metadata_value(metadata, key):
    """Get and clean one value from the extmetadata response."""

    item = metadata.get(key, {})

    if not isinstance(item, dict):
        return ""

    return clean_metadata(item.get("value", ""))


def normalize_file_title(title):
    """Normalize a Commons file title for matching API results."""

    title = title.removeprefix("File:")
    return title.replace("_", " ").strip().casefold()


def load_countries():
    """Load and validate the country database."""

    with INPUT_FILE.open(encoding="utf-8") as file:
        countries = json.load(file)

    if not isinstance(countries, list):
        raise ValueError(
            "Expected countries.json to contain a JSON array."
        )

    seen_codes = set()

    for country in countries:
        code = country.get("code")

        if not code or len(code) != 2 or not code.isalpha():
            raise ValueError(f"Invalid country code: {code}")

        if code in seen_codes:
            raise ValueError(f"Duplicate country code: {code}")

        seen_codes.add(code)

        if not country.get("name"):
            raise ValueError(f"Missing country name for {code}")

        if not country.get("flagSource"):
            raise ValueError(
                f"Missing flagSource for {country['name']} ({code})"
            )

    return countries


def download_file(url, output_path):
    """
    Download an SVG with retry handling.

    The file is written only after a successful response
    containing what appears to be valid SVG content.
    """

    for attempt in range(MAX_ATTEMPTS):
        try:
            response = session.get(
                url,
                timeout=TIMEOUT_SECONDS,
            )

            if response.status_code == 429:
                wait_time = (
                    (attempt + 1) * 10
                    + random.uniform(0, 5)
                )

                print(f"Rate limited. Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
                continue

            response.raise_for_status()

            content = response.content

            if b"<svg" not in content[:10000].lower():
                raise ValueError(
                    "Downloaded file does not appear to be an SVG."
                )

            temporary_path = output_path.with_suffix(".tmp")
            temporary_path.write_bytes(content)
            temporary_path.replace(output_path)

            return True

        except (
            requests.exceptions.RequestException,
            ValueError,
        ) as error:

            if attempt == MAX_ATTEMPTS - 1:
                print(f"Failed: {error}")
                return False

            wait_time = (
                (attempt + 1) * 5
                + random.uniform(0, 3)
            )

            print(
                f"Download error: {error}. "
                f"Retrying in {wait_time:.1f}s..."
            )

            time.sleep(wait_time)

    return False


def download_flag(country, force=False):
    """Download one country's flag."""

    code = country["code"].lower()
    name = country["name"]
    original_filename = country["flagSource"]

    output_filename = f"{code}.svg"
    output_path = OUTPUT_DIR / output_filename

    if output_path.exists() and not force:
        print(f"Already exists: {output_filename}")
        return "skipped"

    url = BASE_URL + quote(original_filename, safe="")

    print(f"Downloading {name} ({code.upper()})...")

    success = download_file(url, output_path)

    time.sleep(DELAY_SECONDS)

    return "success" if success else "failed"


def fetch_attribution_batch(countries):
    """
    Retrieve attribution and license metadata for a batch of files.

    Wikimedia Commons returns file metadata through the
    MediaWiki Imageinfo API and its extmetadata property.
    """

    filenames = [country["flagSource"] for country in countries]

    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "prop": "imageinfo",
        "iiprop": "url|extmetadata",
        "iiextmetadatalanguage": "en",
        "iiextmetadatafilter": (
            "Artist|Attribution|Credit|Source|"
            "LicenseShortName|LicenseUrl|UsageTerms|"
            "Copyrighted|AttributionRequired"
        ),
        "titles": "|".join(
            f"File:{filename}" for filename in filenames
        ),
    }

    for attempt in range(MAX_ATTEMPTS):
        try:
            response = session.get(
                API_URL,
                params=params,
                timeout=TIMEOUT_SECONDS,
            )

            if response.status_code == 429:
                wait_time = (
                    (attempt + 1) * 10
                    + random.uniform(0, 5)
                )

                print(
                    f"API rate limited. Waiting {wait_time:.1f}s..."
                )
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            data = response.json()

            if "error" in data:
                raise ValueError(
                    data["error"].get("info", "Unknown API error.")
                )

            results = {}

            for page in data.get("query", {}).get("pages", []):
                image_info = page.get("imageinfo", [])

                if not image_info:
                    continue

                info = image_info[0]
                metadata = info.get("extmetadata", {})

                results[normalize_file_title(page["title"])] = {
                    "page_url": info.get("descriptionurl", ""),
                    "artist": get_metadata_value(metadata, "Artist"),
                    "attribution": get_metadata_value(
                        metadata, "Attribution"
                    ),
                    "credit": get_metadata_value(metadata, "Credit"),
                    "source": get_metadata_value(metadata, "Source"),
                    "license_name": get_metadata_value(
                        metadata, "LicenseShortName"
                    ),
                    "license_url": get_metadata_value(
                        metadata, "LicenseUrl"
                    ),
                    "usage_terms": get_metadata_value(
                        metadata, "UsageTerms"
                    ),
                    "copyrighted": get_metadata_value(
                        metadata, "Copyrighted"
                    ),
                    "attribution_required": get_metadata_value(
                        metadata, "AttributionRequired"
                    ),
                }

            return results

        except (
            requests.exceptions.RequestException,
            ValueError,
            json.JSONDecodeError,
        ) as error:

            if attempt == MAX_ATTEMPTS - 1:
                raise RuntimeError(
                    f"Could not retrieve Commons metadata: {error}"
                ) from error

            wait_time = (
                (attempt + 1) * 5
                + random.uniform(0, 3)
            )

            print(
                f"Metadata API error: {error}. "
                f"Retrying in {wait_time:.1f}s..."
            )

            time.sleep(wait_time)

    raise RuntimeError("Could not retrieve Commons metadata.")


def fetch_all_attribution(countries):
    """Fetch attribution metadata for all countries in batches."""

    all_metadata = {}

    for start in range(0, len(countries), API_BATCH_SIZE):
        batch = countries[start:start + API_BATCH_SIZE]

        print(
            f"Checking attribution for files "
            f"{start + 1}-{start + len(batch)} "
            f"of {len(countries)}..."
        )

        batch_metadata = fetch_attribution_batch(batch)
        all_metadata.update(batch_metadata)

        # Be polite to Wikimedia between API requests.
        time.sleep(DELAY_SECONDS)

    return all_metadata


def markdown_escape(value):
    """Escape basic Markdown characters in plain-text metadata."""

    return re.sub(r"([\\`*_{}\[\]])", r"\\\1", value)


def build_attribution_entry(country, metadata):
    """Create a Markdown attribution entry and its review warnings."""

    code = country["code"].upper()
    name = country["name"]
    local_filename = f"{code.lower()}.svg"
    original_filename = country["flagSource"]

    warnings = []

    if not metadata:
        warnings.append("No metadata returned by the Commons API.")

        return (
            f"### {markdown_escape(name)} ({code})\n\n"
            f"- Local file: `{local_filename}`\n"
            f"- Commons filename: `{original_filename}`\n"
            f"- **Review required:** metadata could not be retrieved.\n",
            warnings,
        )

    page_url = metadata["page_url"]
    artist = metadata["artist"]
    attribution = metadata["attribution"]
    credit = metadata["credit"]
    source = metadata["source"]
    license_name = metadata["license_name"]
    license_url = metadata["license_url"]
    usage_terms = metadata["usage_terms"]
    copyrighted = metadata["copyrighted"].casefold()
    attribution_required = (
        metadata["attribution_required"].casefold()
    )

    # A custom Attribution field is intended to replace
    # the usual Artist + Credit combination.
    if attribution:
        creator_line = attribution
    else:
        creator_parts = []

        if artist:
            creator_parts.append(artist)

        if credit and credit not in creator_parts:
            creator_parts.append(credit)

        creator_line = "; ".join(creator_parts)

    if not license_name and copyrighted != "false":
        warnings.append("No clear license name found.")

    if not license_url and copyrighted != "false":
        warnings.append("No license URL found.")

    if not creator_line and attribution_required == "true":
        warnings.append(
            "Attribution is required, but no creator or attribution "
            "text was returned."
        )

    if copyrighted == "true":
        warnings.append(
            "Commons metadata marks this file as copyrighted. "
            "Review its license and usage conditions."
        )

    if not page_url:
        warnings.append("No Commons file description URL returned.")

    lines = [
        f"### {markdown_escape(name)} ({code})",
        "",
        f"- Local file: `{local_filename}`",
        f"- Original Commons filename: `{original_filename}`",
    ]

    if page_url:
        lines.append(f"- Commons file page: {page_url}")

    if creator_line:
        lines.append(
            f"- Creator / attribution: {markdown_escape(creator_line)}"
        )

    if source:
        lines.append(f"- Source: {markdown_escape(source)}")

    if license_name:
        if license_url:
            lines.append(
                f"- License: [{markdown_escape(license_name)}]"
                f"({license_url})"
            )
        else:
            lines.append(
                f"- License: {markdown_escape(license_name)}"
            )
    elif copyrighted == "false":
        lines.append("- License status: marked as public domain")

    if usage_terms:
        lines.append(
            f"- Usage terms: {markdown_escape(usage_terms)}"
        )

    if attribution_required:
        lines.append(
            f"- Attribution required (Commons metadata): "
            f"`{attribution_required}`"
        )

    if warnings:
        lines.extend([
            "",
            "- **Review required:** " + " ".join(warnings),
        ])

    lines.append("")

    return "\n".join(lines), warnings


def generate_attribution_file(countries, all_metadata):
    """Generate public/flags/ATTRIBUTION.md."""

    entries = []
    review_items = []

    for country in countries:
        filename = country["flagSource"]
        metadata = all_metadata.get(
            normalize_file_title(filename)
        )

        entry, warnings = build_attribution_entry(
            country,
            metadata,
        )

        entries.append(entry)

        if warnings:
            review_items.append(
                (country["name"], country["code"], warnings)
            )

    content = [
        "# Country flag attributions",
        "",
        "This file records the source and licensing metadata for the "
        "flag SVG files used in this project.",
        "",
        "Metadata retrieved automatically from the Wikimedia Commons "
        "MediaWiki API (`imageinfo` / `extmetadata`).",
        "",
        "**Important:** Automatically retrieved metadata is not a "
        "legal determination. Check each linked Commons file page "
        "and comply with the license terms before publishing.",
        "",
        "---",
        "",
        *entries,
    ]

    temporary_path = ATTRIBUTION_FILE.with_suffix(".tmp")
    temporary_path.write_text(
        "\n".join(content),
        encoding="utf-8",
    )
    temporary_path.replace(ATTRIBUTION_FILE)

    print(f"\nGenerated attribution file: {ATTRIBUTION_FILE}")

    if review_items:
        print("\nAttribution review warnings")
        print("---------------------------")

        for name, code, warnings in review_items:
            print(f"\n{name} ({code})")

            for warning in warnings:
                print(f"  - {warning}")

    return len(review_items)


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Download country flags and generate their "
            "Wikimedia Commons attribution file."
        )
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Redownload flags even if the files already exist.",
    )

    args = parser.parse_args()

    try:
        countries = load_countries()

        OUTPUT_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        print(f"Found {len(countries)} countries.")
        print(f"Output directory: {OUTPUT_DIR}\n")

        results = {
            "success": 0,
            "skipped": 0,
            "failed": 0,
        }

        for country in countries:
            result = download_flag(
                country,
                force=args.force,
            )

            results[result] += 1

        print("\nDownload summary")
        print("----------------")
        print(f"Downloaded: {results['success']}")
        print(f"Skipped:    {results['skipped']}")
        print(f"Failed:     {results['failed']}")
        print(f"Total:      {len(countries)}")

        # Generate attribution even if a local download failed:
        # the attribution relates to the source files in countries.json.
        review_count = 0

        try:
            all_metadata = fetch_all_attribution(countries)
            review_count = generate_attribution_file(
                countries,
                all_metadata,
            )
        except (requests.exceptions.RequestException, RuntimeError,
                ValueError, OSError) as error:
            print(
                f"\nCould not generate attribution file: {error}",
                file=sys.stderr,
            )
            sys.exit(1)

        print("\nAttribution summary")
        print("-------------------")
        print(f"Files needing manual review: {review_count}")

        if results["failed"] > 0 or review_count > 0:
            sys.exit(1)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"\nError: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
