import argparse
import json
import random
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

# Resolve all paths relative to the project root.
PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "src" / "data" / "countries.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "flags"

BASE_URL = "https://commons.wikimedia.org/wiki/Special:FilePath/"

HEADERS = {"User-Agent": "CountryQuiz/1.0 (personal educational project)"}

DELAY_SECONDS = 1.0
MAX_ATTEMPTS = 5
TIMEOUT_SECONDS = 30

session = requests.Session()
session.headers.update(HEADERS)

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
            raise ValueError(
                f"Invalid country code: {code}"
            )

        if code in seen_codes:
            raise ValueError(
                f"Duplicate country code: {code}"
            )

        seen_codes.add(code)

        if not country.get("name"):
            raise ValueError(
                f"Missing country name for {code}"
            )

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

                print(
                    f"Rate limited. Waiting {wait_time:.1f}s..."
                )

                time.sleep(wait_time)
                continue

            response.raise_for_status()

            content = response.content

            # Reject HTML error pages and other unexpected content.
            if b"<svg" not in content[:10000].lower():
                raise ValueError(
                    "Downloaded file does not appear to be an SVG."
                )

            # Write to a temporary file first, preventing
            # incomplete downloads from being saved as final files.
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

    # Be polite to Wikimedia.
    time.sleep(DELAY_SECONDS)

    return "success" if success else "failed"

def main():
    parser = argparse.ArgumentParser(
        description="Download country flags from Wikimedia Commons."
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

        if results["failed"] > 0:
            sys.exit(1)

    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"\nError: {error}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
