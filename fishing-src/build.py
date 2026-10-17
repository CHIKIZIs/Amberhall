import pathlib
d=pathlib.Path(__file__).parent
t=(d/'template.html').read_text()
t=t.replace('/*THREE*/',(d/'three.min.js').read_text()).replace('/*GAME*/',(d/'game.js').read_text())
(d.parent/'fishing.html').write_text(t)
print('ok',len(t))
