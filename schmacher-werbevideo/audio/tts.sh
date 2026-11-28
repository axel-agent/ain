#!/bin/bash
# ./tts.sh <id> "<Text>"  -> vo/raw_<id>.wav (ElevenLabs „Bill“, Schlüssel kommt über den Proxy)
set -e; cd "$(dirname "$0")"; id=$1; txt=$2
python3 -c 'import json,sys;print(json.dumps({"text":sys.argv[1],"model_id":"eleven_multilingual_v2","language_code":"de","voice_settings":{"stability":0.45,"similarity_boost":0.8,"style":0.25,"use_speaker_boost":True}}))' "$txt" > /tmp/tts_$id.json
curl -sS -f -o el/$id.mp3 -H "xi-api-key: dummy" -H "Content-Type: application/json" --data @/tmp/tts_$id.json "https://api.elevenlabs.io/v1/text-to-speech/pqHfZKP75CvOlQylNhV4?output_format=mp3_44100_128"
ffmpeg -nostdin -y -v error -i el/$id.mp3 -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" -ar 44100 -ac 1 vo/raw_$id.wav
echo "$id|$txt" >> vo_lines.txt; ffprobe -v error -show_entries format=duration -of csv=p=0 vo/raw_$id.wav
