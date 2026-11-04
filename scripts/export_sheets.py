
#!/usr/bin/env python3
"""Export Stylist Encyclopedia Google Sheets as static CSV/XLSX files."""

import argparse
import csv
import io
import json
import os
from pathlib import Path
from urllib.parse import quote

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account


MAIN_ID = "1vDpYDFGoCrhZjVxNf2RFOXc9vr3reV25kDtdRHIZXt8"

MAIN_TABS = {
    "items": None,
    "breakdowns": 333774526,
    "themes": 1701381424,
    "serverNames": 1044161109,
    "music": 210977537,
    "taskSuits": 1505720108,
    "suitGallery": 1089816438,
}

SCORER_IDS = {
    "ln": "1do-UIvxKA9-8Un90g-SwqdR7HACPT4H1SnAfDbEgT1o",
    "vn": "1uO81VAutbW249ZUBlukWBDOsejwwUnhHGL3bk2qxypo",
    "cn": "1n_d9afE_v6wphHnWhTdBdX6B6rJQV32cmNEVkHhvupg",
    "jp": "1a8jmEGctFeTthZ59_FMfBmPlgoR6KOWi0RuWQRzIyHU",
    "tw": "1xvY-FBKSDAg_9F3By7ERIh_ZkvMitJfuWVbRjYh1Jns",
}

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]


def csv_bytes(values):
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerows(values)
    return output.getvalue().encode("utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    raw_key = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw_key:
        raise RuntimeError(
            "Missing GOOGLE_SERVICE_ACCOUNT_JSON Actions secret"
        )

    credentials = service_account.Credentials.from_service_account_info(
        json.loads(raw_key),
        scopes=SCOPES,
    )
    credentials.refresh(Request())

    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {credentials.token}"
    })

    root = Path(args.output)

    def get_json(url):
        response = session.get(url, timeout=90)
        response.raise_for_status()
        return response.json()

    def sheet_metadata(spreadsheet_id):
        fields = "sheets(properties(sheetId,title,index))"
        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/"
            f"{spreadsheet_id}?fields={quote(fields, safe='(),')}"
        )
        return get_json(url)["sheets"]

    def find_title(spreadsheet_id, gid):
        sheets = sheet_metadata(spreadsheet_id)

        if gid is None:
            first = min(
                sheets,
                key=lambda s: s["properties"].get("index", 0)
            )
            return first["properties"]["title"]

        for sheet in sheets:
            if sheet["properties"]["sheetId"] == gid:
                return sheet["properties"]["title"]

        raise RuntimeError(
            f"Worksheet gid {gid} not found in {spreadsheet_id}"
        )

    def values_csv(spreadsheet_id, title):
        cell_range = quote(f"'{title}'!A:ZZ", safe="")
        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/"
            f"{spreadsheet_id}/values/{cell_range}"
            "?valueRenderOption=FORMATTED_VALUE"
        )
        values = get_json(url).get("values", [])
        return csv_bytes(values)

    def write_file(relative_path, content):
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        print(f"Wrote {relative_path}: {len(content)} bytes")

    for key, gid in MAIN_TABS.items():
        title = find_title(MAIN_ID, gid)
        content = values_csv(MAIN_ID, title)
        write_file(f"main/{key}.csv", content)

    for server, spreadsheet_id in SCORER_IDS.items():
        xlsx_url = (
            f"https://www.googleapis.com/drive/v3/files/"
            f"{spreadsheet_id}/export"
            "?mimeType=application%2Fvnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        )

        response = session.get(xlsx_url, timeout=180)
        response.raise_for_status()

        if not response.content.startswith(b"PK"):
            raise RuntimeError(
                f"Google did not return a valid XLSX for {server}"
            )

        write_file(f"scorer/{server}.xlsx", response.content)

        sheets = sheet_metadata(spreadsheet_id)
        clothes_title = next(
            (
                s["properties"]["title"]
                for s in sheets
                if s["properties"]["title"].strip().lower() == "clothes"
            ),
            None,
        )

        if not clothes_title:
            raise RuntimeError(
                f"Clothes worksheet not found for server {server}"
            )

        clothes_csv = values_csv(spreadsheet_id, clothes_title)
        write_file(f"wardrobe/{server}.csv", clothes_csv)


if __name__ == "__main__":
    main()
