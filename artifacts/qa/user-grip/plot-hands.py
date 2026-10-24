"""CPU-only source triangle projections, not screenshots or generated art."""
import json
from pathlib import Path
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

out=Path('artifacts/qa/user-grip')
g=json.loads((out/'hand-topology.json').read_text())
v=np.array(g['vertices']);uv=np.array(g['uvs'])
tex=cv2.cvtColor(cv2.imread('C:/Users/Zero/AppData/Local/Temp/tidal-user-fbx-inspection-20261022/modelf23d8a6f4b3801-0-tripo_model_basecolor.JPEG'),cv2.COLOR_BGR2RGB)
for side,hand in g['hands'].items():
 ts=np.array(hand['triangles']);centers=v[ts].mean(axis=1);tuv=np.mod(uv[ts].mean(axis=1),1)
 colors=tex[((1-tuv[:,1])*2047).astype(int),(tuv[:,0]*2047).astype(int)]/255
 fig,axes=plt.subplots(2,3,figsize=(18,12))
 for ax,(xi,yi,depth,front,title) in zip(axes.flat,[(0,1,2,1,'+Z front'),(0,1,2,-1,'-Z back'),(2,1,0,1,'+X side'),(2,1,0,-1,'-X side'),(0,2,1,1,'+Y top'),(0,2,1,-1,'-Y bottom')]):
  order=np.argsort(centers[:,depth]*front)
  coll=PolyCollection(v[ts[order]][:,:,[xi,yi]],facecolors=colors[order],edgecolors='#664c35',linewidths=.38)
  ax.add_collection(coll);ax.autoscale();ax.set_aspect('equal');ax.set_title(f'{side} {title} (actual source triangles)')
  ax.grid(alpha=.2);ax.tick_params(axis='both',labelsize=8)
 fig.tight_layout();fig.savefig(out/f'{side}-source-projections.png',dpi=170);plt.close(fig)
