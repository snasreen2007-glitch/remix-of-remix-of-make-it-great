import os
import sys
import json
import urllib.request
import ssl

TOKEN = os.environ.get("GITHUB_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else "")

if not TOKEN:
    print("=" * 60)
    print("GITHUB TOKEN REQUIRED")
    print("=" * 60)
    print("To publish or replace the APK in GitHub Releases, a token is needed:")
    print("1. Visit: https://github.com/settings/tokens")
    print("2. Generate a token (classic) with 'repo' scope checked.")
    print("3. Run: python scripts/publish_release.py <your_github_token>")
    print("=" * 60)
    try:
        TOKEN = input("Enter GitHub Personal Access Token: ").strip()
    except Exception:
        pass

if not TOKEN:
    print("Error: No GitHub token provided. Exiting.")
    sys.exit(1)
REPO = "Ayubshaik01/remix-of-remix-of-make-it-great"
TAG = "v1.0.0"
APK_PATH = r"android\app\build\outputs\apk\release\app-release.apk"

ctx = ssl._create_unverified_context()

def make_request(url, method="GET", data=None, headers=None):
    hdrs = {
        "Authorization": f"Bearer {TOKEN}",
        "User-Agent": "KisanAI-Publisher",
        "Accept": "application/vnd.github+json"
    }
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with urllib.request.urlopen(req, context=ctx) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    if not os.path.exists(APK_PATH):
        print(f"Error: APK not found at {APK_PATH}")
        sys.exit(1)

    apk_size = os.path.getsize(APK_PATH)
    print(f"Found APK: {APK_PATH} ({apk_size / (1024*1024):.2f} MB)")

    # 1. Check or Create Release
    release = None
    try:
        release = make_request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}")
        print(f"Existing release {TAG} found (id: {release.get('id')})")
    except Exception as e:
        print(f"Release {TAG} does not exist yet. Creating...")
        payload = json.dumps({
            "tag_name": TAG,
            "target_commitish": "main",
            "name": f"KisanAI {TAG} — Official Release",
            "body": "Official Offline Android APK for KisanAI (100% on-device vision & agricultural AI).",
            "draft": False,
            "prerelease": False
        }).encode("utf-8")
        release = make_request(
            f"https://api.github.com/repos/{REPO}/releases",
            method="POST",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        print(f"Created release {TAG} (id: {release.get('id')})")

    # 2. Check for existing assets in release and delete if duplicate
    upload_url_raw = release.get("upload_url", "")
    upload_url = upload_url_raw.split("{")[0]
    assets = release.get("assets", [])
    for a in assets:
        if a.get("name") in ["kisanai-offline-ai.apk", "app-release.apk"]:
            asset_id = a.get("id")
            print(f"Deleting older asset {a.get('name')} (id: {asset_id})...")
            try:
                del_req = urllib.request.Request(
                    f"https://api.github.com/repos/{REPO}/releases/assets/{asset_id}",
                    headers={
                        "Authorization": f"Bearer {TOKEN}",
                        "User-Agent": "KisanAI-Publisher",
                        "Accept": "application/vnd.github+json"
                    },
                    method="DELETE"
                )
                with urllib.request.urlopen(del_req, context=ctx) as r:
                    pass
                print("Deleted old asset.")
            except Exception as ex:
                print(f"Asset deletion error: {ex}")

    # 3. Upload APK
    target_upload_url = f"{upload_url}?name=kisanai-offline-ai.apk"
    print(f"Uploading APK to {target_upload_url}...")

    with open(APK_PATH, "rb") as f:
        apk_data = f.read()

    upload_req = urllib.request.Request(
        target_upload_url,
        data=apk_data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "User-Agent": "KisanAI-Publisher",
            "Content-Type": "application/vnd.android.package-archive",
            "Content-Length": str(len(apk_data))
        },
        method="POST"
    )

    with urllib.request.urlopen(upload_req, context=ctx) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("Upload successful!")
        print("Browser download URL:", res.get("browser_download_url"))

if __name__ == "__main__":
    main()

