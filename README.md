# rum-profile-js

Sampling profile code that can be used to output the traces in the console for any web app.

The code is based on the Experimental JS Self Profiling API which is available [here](https://github.com/WICG/js-self-profiling)

### How to run the code

The API is experimental, Its available only on Chrome behind a flag `--enable-blink-features=ExperimentalJSProfiler`. In order to run on a real page, You can do the following

1. Create Origin trail token https://developers.chrome.com/origintrials/#/register_trial/1346576288583778305

2. Paste the code from `profile.js` inside the `<script>` tags.

3. Run the web app on Chrome 78 and check the devtools console for the trace logs.
