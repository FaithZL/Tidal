"""QA only: inspect the actual browser recording, not game/recognition performance."""
import hashlib
import json
from pathlib import Path
import sys

import cv2

path = Path(sys.argv[1]).resolve()
capture = cv2.VideoCapture(str(path))
if not capture.isOpened():
    raise RuntimeError(f"Cannot decode recording: {path}")
fps = capture.get(cv2.CAP_PROP_FPS)
if fps <= 0:
    raise RuntimeError("Recording has no readable encoding frame rate")
width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
count = 0
unique = set()
while True:
    ok, frame = capture.read()
    if not ok:
        break
    count += 1
    unique.add(hashlib.sha256(frame.tobytes()).digest())
    if count in (50, 110, 150, 220):
        cv2.imwrite(str(path.parent / f"decoded-{count:03}.png"), frame)
capture.release()
report = {
    "file": path.name,
    "bytes": path.stat().st_size,
    "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    "width": width,
    "height": height,
    "decodedFrames": count,
    "uniqueDecodedFrames": len(unique),
    "encodedFps": fps,
    "durationSeconds": count / fps,
    "scope": "Uninterrupted Playwright screen recording. Encoding FPS is not game FPS, hardware performance or real camera accuracy.",
}
(path.parent / "video-metadata.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
