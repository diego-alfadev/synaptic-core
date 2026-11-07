# Offline benchmark pilot
Node >=18; no dependencies or model calls. Run from the product repository:
`node bench/run.js --dry-run --ref HEAD`
Use `--repo <repository>` to select a local source repository explicitly.
The selected commit's standalone/synaptic bundle is copied into an isolated synthetic workspace.
No skill is executed. The workspace is removed after the check. Results are one JSON line on stdout.

The dry-run checks a known-good answer and a seeded wrong answer; the latter must fail.
`--answer <answer.json>` checks a recorded output. Add `--dry-run` to run controls too.
A bad answer exits 1; runner errors exit 2. Pass/fail uses three exact factual fields.
This validates installation plumbing and checker behaviour, **not live model efficacy**.
Neither installing a version nor checking a recorded answer proves that version produced it.
Refuse provenance or efficacy claims without independently captured run metadata.

Host/model/settings/tokens/cost are null because this pilot does not collect or invent them.
Subscription usage is not converted to dollars. Reports are dry-run or recorded-answer-check.
Save stdout privately when evidence is needed; no product results are committed automatically.
Live version comparisons must hold host, model, configuration, fixture and prompt fixed.
Different hosts/models are separate experiments. Repetitions measure variance, never best-of-N.
No live model adapter or efficacy evidence is included in this pilot.
