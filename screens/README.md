# Screenshots

Put real screenshots here. A tutorial step shows one when its `shot` name in `tutorials.json` matches a file name here (PNG, JPG or WebP), for example `opencode-start.png`.

Shot names used so far: opencode-start, opencode-plan, aider-diff, cline-panel, cline-plan, continue-status, hermes-start, openwebui-chat, openwebui-documents, openwebui-context.

Tips:
- Crop to the part that matters and keep the width under about 1200 px. `build.py` embeds each image in `index.html` so the page still works offline, and warns if one is over 400 KB.
- Check that no personal information (usernames, hostnames, file paths, keys) is visible.
- Add a caption in `tutorials.json` by giving the step a `shot_caption`.
