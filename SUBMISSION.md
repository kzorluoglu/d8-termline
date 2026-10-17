# WordPress.org submission — 2.0.3

Display name: D8 Pardus Terminal
Proposed slug and GitHub repository name: d8-pardus-terminal
Upload: dist/d8-pardus-terminal-2.0.3.zip

## Validation

Tested on an isolated WordPress 7.1.3 / PHP 8.3 installation on 2026-10-17.
Plugin Check 2.1.0, all default checks including runtime checks, on the extracted release package:

```
wp --require=wp-content/plugins/plugin-check/cli.php plugin check /tmp/d8-packaged --slug=d8-pardus-terminal --mode=new --format=json
Success: Checks complete. No errors found.
```

Activation and frontend markup/assets smoke check passed. Five DOM integration tests passed; both PHP files passed syntax checks. No check categories or codes were excluded. Automated checks do not guarantee review approval or absence of vulnerabilities.

## Additional Information (paste into the submission form)

D8 Pardus Terminal is an independent frontend console for browsing public WordPress posts and categories with keyboard commands. It does not execute shell commands, PHP or user-supplied JavaScript, edit files, or download executable code. All runtime assets are bundled locally. It uses only the same-origin public WordPress REST API, omits authentication credentials, and includes no external services, tracking, licensing gates or paid features. The compact appearance is inspired by classic Pardus desktops; this project is not affiliated with or endorsed by Pardus, and no Pardus logos or desktop assets are bundled.

## Before uploading

Confirm the FAQ/guideline and ownership acknowledgements yourself. WordPress reviewers make the final naming and acceptance decision. Rename the GitHub repository to d8-pardus-terminal when ready; the existing GitHub links continue to work through GitHub redirects after a rename. Do not replace the live plugin directory with a second activated copy, as it would instantiate the same class twice. For live upgrades, replace the files in the existing active directory.
