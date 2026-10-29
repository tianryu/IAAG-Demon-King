import sys,json
from pathlib import Path
sys.path.insert(0,str(Path('.tools/audio-python').resolve()))
import soundfile as sf
mapping={
'click':('interface','click_001.ogg'),
'upgrade':('interface','confirmation_002.ogg'),
'hit':('rpg','knifeSlice.ogg'),
'shoot':('rpg','cloth1.ogg'),
'coin':('rpg','handleCoins2.ogg'),
'start':('interface','open_001.ogg'),
'win':('interface','confirmation_004.ogg'),
'lose':('interface','error_005.ogg')}
report={}
for key,(pack,name) in mapping.items():
 source=next(Path('assets/source/audio',pack).rglob(name))
 data,rate=sf.read(str(source))
 if data.ndim>1:data=data.mean(axis=1)
 sf.write('public/assets/audio/'+key+'.wav',data,rate,subtype='PCM_16')
 report[key]={'source':str(source),'seconds':round(len(data)/rate,3),'sampleRate':rate}
report['music']=str(sf.info('public/assets/audio/dungeon.mp3'))
Path('docs/audio-validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
