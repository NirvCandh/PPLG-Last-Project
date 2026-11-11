"""Editable native 2D pixel-art source for Circuit Quest's component set.

Extends the project's original code-drawn placeholders with detailed, aligned sprites.
No generated image or external API is required to rebuild this atlas.
"""
from pathlib import Path
from PIL import Image, ImageDraw
P=Path(__file__).parent;OUT=P/'assets/art2d';OUT.mkdir(exist_ok=True)
INK='#112236';EDGE='#263b52';TEAL='#267f83';CYAN='#5cebdc';LIGHT='#d7f9ed';GOLD='#efbb61'
sprites={}
def begin(name,w,h):
 im=Image.new('RGBA',(w,h));sprites[name]=im;return ImageDraw.Draw(im)
def poly(d,p,c,outline=INK):d.polygon(p,fill=c,outline=outline)
def rect(d,b,c,o=None,width=1):d.rectangle(b,fill=c,outline=o,width=width)

# Characters: full side-view silhouettes, proper faces, clothing, hands and equipment.
for name,prof in [('Ohm',True),('Warga',False)]:
 d=begin(name,64,96)
 # Legs and separate soles sit on one common baseline.
 poly(d,[(25,61),(36,61),(35,85),(41,88),(41,92),(24,92),(23,86)],'#30435a')
 poly(d,[(34,60),(44,62),(43,85),(49,89),(49,93),(34,93),(32,86)],'#1b3046')
 rect(d,(25,87,40,91),'#405566');rect(d,(35,89,48,92),'#596c79');rect(d,(25,92,41,94),INK);rect(d,(35,93,49,94),INK)
 if prof:
  # Lab coat, teal shirt, lapels, pocket and metal buttons.
  poly(d,[(23,31),(38,29),(46,36),(46,68),(40,76),(22,74),(19,47)],'#cbdedc')
  poly(d,[(31,31),(39,31),(42,62),(33,66),(28,53)],TEAL)
  poly(d,[(23,32),(31,31),(29,43),(34,49),(27,51),(27,73),(20,72),(20,44)],'#f0f5e8')
  poly(d,[(38,32),(43,35),(45,73),(35,74),(34,51),(39,44),(36,41)],'#9dbabc')
  rect(d,(38,53,43,61),'#e4eee2',EDGE);rect(d,(39,51,40,55),CYAN)
  for y in [53,62,69]:rect(d,(32,y,33,y+1),GOLD)
  poly(d,[(22,36),(27,39),(26,54),(33,60),(29,66),(18,57),(17,46)],'#a0bfc1')
  poly(d,[(28,58),(34,60),(36,65),(32,69),(27,65)],'#e6b68c')
  poly(d,[(41,36),(46,38),(46,49),(53,52),(50,58),(39,54)],'#e8eee0')
  rect(d,(43,48,58,68),EDGE,INK);rect(d,(46,51,56,64),'#285665');rect(d,(48,54,54,55),CYAN);rect(d,(48,59,53,60),'#80a6a5')
  rect(d,(43,51,47,56),'#e6b68c',INK)
 else:
  # Gardener: ponytail, orange scarf, rolled sleeves and utility belt.
  poly(d,[(24,8),(16,13),(14,31),(18,42),(23,35),(26,20)],'#70432d')
  rect(d,(17,17,19,30),'#a3673b');poly(d,[(24,31),(39,30),(46,36),(47,62),(40,68),(22,66),(18,43)],'#486c49')
  poly(d,[(23,34),(31,34),(29,62),(22,63),(20,43)],'#83a75b');rect(d,(33,38,40,46),'#385448',INK)
  rect(d,(23,60,45,65),'#94623b',INK);rect(d,(32,60,37,65),GOLD,INK)
  rect(d,(22,64,29,73),'#bb8444',INK);rect(d,(24,66,27,67),'#e5b16a')
  poly(d,[(21,36),(26,39),(25,50),(31,59),(27,64),(17,54),(16,44)],'#6f9255')
  rect(d,(20,50,26,54),'#d6c39a',INK);poly(d,[(26,56),(31,57),(34,62),(30,66),(26,63)],'#e6b083')
  poly(d,[(40,35),(45,36),(48,48),(54,51),(51,58),(42,53)],'#54794b');rect(d,(44,48,50,52),'#d6c39a',INK)
  poly(d,[(49,52),(55,51),(58,55),(54,60),(49,58)],'#e6b083')
  rect(d,(40,63,43,75),EDGE);rect(d,(39,63,44,65),'#a9bdba')
 # Neck, head, face and hair are drawn last for clean silhouettes.
 rect(d,(31,25,38,34),'#c88e68',INK)
 poly(d,[(27,9),(38,7),(44,12),(44,18),(48,21),(46,24),(43,25),(42,30),(33,31),(26,25),(24,17)],'#e9b88d')
 rect(d,(28,19,30,23),'#c88b68');rect(d,(42,27,44,28),'#935d4d');rect(d,(37,17,40,19),INK)
 if prof:
  poly(d,[(24,17),(22,10),(25,5),(29,6),(31,2),(37,4),(41,3),(45,8),(43,14),(35,12),(32,18),(28,19)],'#e6eee2')
  rect(d,(25,10,27,17),'#9eb9bd');rect(d,(33,17,41,23),EDGE);rect(d,(35,18,39,21),'#b5efdf');rect(d,(42,18,45,19),EDGE)
  poly(d,[(38,25),(43,24),(46,26),(42,28),(38,27)],'#edf4e4')
 else:
  poly(d,[(24,19),(22,11),(26,6),(35,4),(42,7),(44,14),(39,13),(34,10),(30,16),(29,22)],'#70432d')
  rect(d,(27,9,34,10),'#b27a49');rect(d,(24,22,28,28),'#5b352b');rect(d,(33,31,41,35),'#e99748',INK)
  poly(d,[(34,34),(40,34),(38,47),(33,42)],'#bf6039')
 rect(d,(37,18,39,19),'#8ce9d5')

d=begin('Bug',64,42)
for x in [13,27,41]:
 for side in [-1,1]:
  y=29 if side<0 else 32
  d.line([(x,24),(x-7,y),(x-9,37)],fill=INK,width=5);d.line([(x,24),(x-7,y),(x-9,37)],fill='#4d7886',width=2)
poly(d,[(9,18),(15,8),(28,4),(43,8),(48,19),(43,30),(18,30),(8,25)],'#284b65')
poly(d,[(14,16),(20,9),(31,7),(40,11),(44,18),(39,22),(17,22)],TEAL)
d.line([(29,8),(27,27)],fill=INK,width=2);rect(d,(17,12,22,14),'#70b8aa');rect(d,(33,13,38,15),'#70b8aa')
poly(d,[(43,14),(55,13),(61,20),(58,29),(45,30),(40,23)],EDGE)
rect(d,(50,18,54,22),'#ff806b',INK);rect(d,(56,20,59,23),'#ffd08b');d.line([(51,14),(51,7),(57,3)],fill=INK,width=3);rect(d,(56,1,59,4),'#f88070')

d=begin('Glitch',56,60)
poly(d,[(18,7),(38,7),(39,13),(45,14),(45,22),(50,22),(47,43),(40,43),(40,51),(32,47),(25,55),(20,47),(12,51),(9,42),(5,36),(9,19),(15,17)],'#44366c')
poly(d,[(19,12),(35,12),(41,20),(42,38),(36,43),(28,40),(20,45),(13,36),(14,21)],'#77629e')
rect(d,(17,24,24,31),INK);rect(d,(31,24,38,31),INK);rect(d,(19,25,23,28),CYAN);rect(d,(33,25,37,28),CYAN)
rect(d,(25,35,30,37),'#c3a2e2');rect(d,(0,11,4,15),'#9c81bd');rect(d,(49,5,54,9),CYAN);rect(d,(48,47,52,51),'#8b6aaa');rect(d,(3,54,7,58),'#b39bcf')

d=begin('Battery',28,40)
rect(d,(9,0,18,5),GOLD,INK);poly(d,[(4,5),(23,5),(26,9),(26,35),(22,39),(5,39),(2,35),(2,9)],EDGE)
rect(d,(6,9,22,34),TEAL,INK);rect(d,(7,10,9,31),'#5fb7aa');rect(d,(11,10,21,12),CYAN)
poly(d,[(15,15),(11,24),(16,24),(13,32),(21,21),(16,21),(19,15)],GOLD,EDGE)
rect(d,(8,35,20,36),'#789b9b')
d=begin('Pulse',64,24)
for y,x in [(5,12),(11,0),(18,8)]:rect(d,(x,y,42,y+2),'#247e9a')
poly(d,[(29,6),(49,4),(61,9),(63,12),(57,18),(34,19),(24,14)],'#279bb4')
poly(d,[(34,8),(50,7),(58,11),(58,14),(48,17),(30,14)],CYAN)
rect(d,(38,10,55,12),LIGHT)

d=begin('DHT22',36,56)
for x in [8,14,20,26]:rect(d,(x,44,x+2,55),GOLD,EDGE)
poly(d,[(5,3),(29,3),(32,7),(32,43),(28,47),(6,47),(3,43),(3,7)],'#d7e7df')
rect(d,(7,8,28,39),'#b2ccc9',EDGE)
for y in range(11,37,5):
 for x in [9,20]:rect(d,(x,y,x+6,y+1),'#395c69')
rect(d,(11,41,18,43),'#6ab9bd');rect(d,(23,41,25,43),CYAN)

d=begin('LDR',44,54)
rect(d,(9,30,36,45),'#356f57',INK);rect(d,(11,33,13,35),GOLD);rect(d,(31,39,34,42),GOLD)
d.ellipse((6,3,37,34),fill='#ae753b',outline=INK,width=2);d.ellipse((9,6,34,31),fill='#edc172',outline='#714e36',width=1)
d.line([(15,11),(27,11),(27,16),(16,16),(16,21),(27,21),(27,26),(17,26)],fill='#875039',width=2)
rect(d,(15,46,17,53),GOLD,EDGE);rect(d,(28,46,30,53),GOLD,EDGE)

d=begin('Soil',40,64)
poly(d,[(7,5),(32,5),(35,10),(35,29),(30,34),(9,34),(4,29),(4,10)],'#36765b')
rect(d,(9,9,30,27),'#4f986d',INK);rect(d,(11,12,17,20),EDGE);rect(d,(22,11,27,14),GOLD);rect(d,(23,21,28,23),CYAN)
for x in [10,17,24]:rect(d,(x,0,x+2,6),GOLD,INK)
for x in [9,25]:
 poly(d,[(x,30),(x+6,30),(x+6,58),(x+3,63),(x,58)],'#bb874b')
 rect(d,(x+2,34,x+3,56),'#f1c478')

d=begin('PIR',56,52)
poly(d,[(4,22),(49,22),(52,26),(52,44),(48,48),(5,48),(2,44),(2,26)],'#39765f')
rect(d,(6,27,48,43),'#4a8c6a',INK)
for x in [9,39]:d.ellipse((x,32,x+5,37),fill=GOLD,outline=INK)
poly(d,[(12,29),(12,14),(17,6),(26,3),(36,6),(42,14),(42,29)],'#e4eee1')
poly(d,[(13,16),(18,8),(25,5),(27,15),(20,23),(13,25)],'#b8d3cf',None)
poly(d,[(27,6),(36,9),(41,17),(34,23),(27,16)],'#f5f9e9',None)
d.line([(12,28),(20,23),(34,23),(42,28)],fill='#87aeb1',width=1)
for x in [18,26,34]:rect(d,(x,47,x+2,51),GOLD,INK)

d=begin('Heart',38,34)
poly(d,[(4,5),(10,2),(16,4),(19,8),(23,4),(30,3),(35,8),(35,17),(19,32),(3,17),(2,10)],'#bf5160')
poly(d,[(7,8),(13,6),(18,12),(23,9),(30,7),(32,14),(19,27),(6,15)],'#f17b78',None)
rect(d,(8,8,12,10),'#ffcfaa');rect(d,(15,16,23,18),LIGHT);rect(d,(18,13,20,22),LIGHT)
d=begin('Jumper',54,44)
for offset,color in [(0,'#e9836b'),(9,GOLD),(18,'#54b7ab')]:
 points=[(7+offset,8),(4+offset,18),(9+offset,33),(21+offset,35),(31+offset,27),(28+offset,10)]
 d.line(points,fill=INK,width=5,joint='curve');d.line(points,fill=color,width=3,joint='curve')
 rect(d,(5+offset,2,10+offset,11),EDGE,INK);rect(d,(6+offset,0,8+offset,3),'#b4d3c9')

for name,opened in [('ChestClosed',False),('ChestOpen',True)]:
 d=begin(name,72,60)
 poly(d,[(5,25),(65,25),(69,29),(69,53),(64,58),(7,58),(3,54),(3,30)],'#2e4d61')
 rect(d,(8,32,64,51),'#3c6475',INK);rect(d,(9,52,63,54),'#638a90')
 for x in [8,59]:rect(d,(x,31,x+4,53),'#233c52',INK)
 if opened:
  poly(d,[(8,2),(61,2),(66,7),(63,27),(8,26),(4,21),(4,7)],'#2d4b60')
  rect(d,(10,7,59,22),'#355e6c',INK);rect(d,(13,12,56,15),CYAN)
  rect(d,(10,26,61,32),'#95ffe1',INK)
 else:
  poly(d,[(9,17),(62,17),(67,23),(67,33),(5,33),(5,22)],'#315f73')
  rect(d,(9,23,63,25),CYAN);rect(d,(31,27,42,40),EDGE,INK);rect(d,(34,30,39,35),CYAN)
 for x in [10,60]:
  for y in [35,49]:rect(d,(x,y,x+2,y+2),GOLD)

for name,on in [('TerminalOff',False),('TerminalOn',True)]:
 d=begin(name,70,72)
 poly(d,[(9,5),(59,5),(64,10),(64,43),(58,49),(10,49),(5,43),(5,11)],'#2c4b60')
 rect(d,(11,11,58,39),'#101f36',INK,width=2);rect(d,(13,13,56,36),'#235061' if on else '#1a3046')
 rect(d,(14,41,20,43),CYAN if on else '#4c7379');rect(d,(25,41,31,43),'#557f88')
 if on:
  d.line([(16,27),(22,27),(25,22),(28,29),(32,18),(36,28),(42,25),(52,25)],fill=CYAN,width=2);rect(d,(17,16,24,17),'#7baba6')
 rect(d,(28,49,42,60),EDGE,INK);rect(d,(32,51,36,57),'#669599')
 poly(d,[(13,59),(55,59),(63,67),(62,71),(7,71),(6,67)],'#385d70');rect(d,(14,64,53,66),CYAN if on else '#547e88')

d=begin('Workbench',102,76)
# Steel feet, warm wooden slab, tool board and small monitor, all orthographic side-view.
for x in [10,81]:
 poly(d,[(x,34),(x+10,34),(x+10,69),(x+14,71),(x+14,75),(x-3,75),(x-3,71),(x,69)],EDGE)
 rect(d,(x+3,39,x+5,67),'#5e8b8e')
rect(d,(20,61,81,66),'#8d603e',INK);rect(d,(3,29,98,40),'#ad7546',INK);rect(d,(6,30,95,32),'#e0aa65');rect(d,(7,36,94,38),'#744e37')
rect(d,(63,2,92,25),'#2b4c61',INK,width=2);rect(d,(67,6,88,20),'#214652');d.line([(69,15),(74,15),(77,9),(81,16),(86,12)],fill=CYAN,width=1);rect(d,(75,25,80,28),EDGE)
rect(d,(23,19,53,28),'#e3d7aa',INK)
for y in [22,25]:
 for x in range(27,52,4):rect(d,(x,y,x+1,y),'#7b8a7b')
rect(d,(28,17,36,20),TEAL,INK);d.line([(11,24),(18,14)],fill='#b8cfca',width=2);rect(d,(8,24,13,28),'#db8b4e',INK)

d=begin('SensorPost',46,88)
rect(d,(20,17,28,77),EDGE,INK);rect(d,(22,23,24,72),'#5e969a')
poly(d,[(3,3),(37,3),(42,19),(7,19)],'#2a4c63');d.line([(7,8),(36,8)],fill=CYAN,width=1);d.line([(9,13),(38,13)],fill='#52aeb6',width=1)
for x in [13,23,31]:d.line([(x,4),(x+4,17)],fill='#75b7bc',width=1)
poly(d,[(10,28),(36,28),(39,32),(39,57),(35,61),(10,61),(7,57),(7,32)],'#345c6e')
rect(d,(12,33,34,48),INK);rect(d,(15,36,31,45),TEAL);rect(d,(16,37,28,39),CYAN);rect(d,(15,53,19,56),CYAN);rect(d,(25,53,32,54),GOLD)
poly(d,[(12,77),(35,77),(40,82),(40,87),(6,87),(6,82)],'#426c7b');rect(d,(12,81,34,83),'#85b4ad')

order=['Ohm','Warga','Bug','Glitch','Battery','Pulse','DHT22','LDR','Soil','PIR','Heart','Jumper','ChestClosed','ChestOpen','TerminalOff','TerminalOn','Workbench','SensorPost']
atlas=Image.new('RGBA',(1536,768))
for i,name in enumerate(order):
 im=sprites[name];w,h=im.size;scale=min(216/w,216/h)
 im=im.resize((round(w*scale),round(h*scale)),Image.Resampling.NEAREST)
 atlas.alpha_composite(im,((i%6)*256+(256-im.width)//2,(i//6)*256+(256-im.height)//2))
atlas.save(OUT/'CircuitQuest-2D-Atlas.png')
(OUT/'ART-SOURCE.txt').write_text('Editable code-native 2D pixel art: draw_2d_components.py. Built-in image generation was attempted but did not return an image; its pending request was canceled. The installed atlas is authored by the project source code, not generated by an external model.\n',encoding='utf-8')
print('Created 18 detailed code-native 2D pixel sprites in a transparent atlas.')
