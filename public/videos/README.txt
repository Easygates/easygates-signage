VIDEOS FOLDER
=============
Put the videos the screens should play in this folder (on the server PC), for example:

    public\videos\showroom-loop.mp4

Then, in the scene editor, open a video template, click "Videos folder" next to the Video field and
pick the file. New files show up straight away - no rebuild or restart.

Tips for smooth playback on TVs and sticks
  - Use .mp4 (H.264) or .webm. 1920x1080 or smaller; about 4-8 Mbit/s is plenty.
  - The video plays muted and loops, so no audio track is needed.
  - Keep each file under a few hundred MB; shorter clips are quicker to start.
  - Set the slide's Duration to the clip length (the editor has a button for it).

To keep the videos somewhere else (another drive), set VIDEOS_DIR in .env, e.g.  VIDEOS_DIR="D:\Videos"
This folder is not uploaded to GitHub: your videos stay on this PC.
