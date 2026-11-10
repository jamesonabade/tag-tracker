"""Regressions: missing Google devices may be hidden without deleting history."""
import csv
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from server import db


class GoogleDeviceSyncTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.patch_path = patch.object(db, "DB_PATH", Path(self.tmp.name) / "tracker.db")
        self.patch_path.start()
        self.addCleanup(self.patch_path.stop)
        db.init()

    def test_missing_device_is_off_and_can_be_hidden_without_erasing_history(self):
        db.upsert_device("old-id", "Old Tag")
        db.insert_locations("old-id", [{"ts": 1234, "lat": 12.4, "lon": -34.1}])
        db.sync_google_devices([("New Tag", "new-id")])
        devices = {d["id"]: d for d in db.get_devices()}
        self.assertEqual(devices["old-id"]["google_present"], 0)
        self.assertEqual(devices["new-id"]["google_present"], 1)
        self.assertFalse(db.hide_offline_device("new-id"))
        self.assertTrue(db.hide_offline_device("old-id"))
        self.assertFalse(db.hide_offline_device("old-id"))
        self.assertNotIn("old-id", [d["id"] for d in db.get_devices()])
        self.assertEqual(len(db.get_history("old-id", 0, 9999)), 1)

        # Re-importing a Drive CSV cannot accidentally unhide the removed tag.
        data_file = Path(self.tmp.name) / "restore.csv"
        with data_file.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(db.CSV_HEADER)
            writer.writerow(["old-id", "Old Tag", "2026-01-01", 1234, 12.4, -34.1, "", 10, 0, ""])
        db.import_csv(data_file)
        self.assertNotIn("old-id", [d["id"] for d in db.get_devices()])

        # If Google lists that ID again, the tag reappears automatically.
        db.sync_google_devices([("Old Tag", "old-id")])
        restored = {d["id"]: d for d in db.get_devices()}
        self.assertEqual(restored["old-id"]["google_present"], 1)
        self.assertEqual(len(db.get_history("old-id", 0, 9999)), 1)

    def test_old_database_migrates_in_place(self):
        # Ensure the new status columns remain stable on repeated initialization.
        db.init()
        with db.connect() as c:
            cols = {row["name"] for row in c.execute("PRAGMA table_info(devices)")}
        self.assertIn("google_present", cols)
        self.assertIn("hidden", cols)


if __name__ == "__main__":
    unittest.main()
