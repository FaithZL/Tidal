"""Real hand triangle/plane intersections for grip-cavity measurement."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

p=Path('artifacts/qa/user-grip');g=json.loads((p/'hand-topology.json').read_text());v=np.array(g['vertices'])
fig,axes=plt.subplots(2,4,figsize=(20,12))
data={}
for row,(side,zs) in enumerate([('right',[.11,.15,.19,.23]),('left',[-.10,-.06,-.02,.02])]):
 ts=np.array(g['hands'][side]['triangles']);data[side]=[]
 for ax,z in zip(axes[row],zs):
  seg=[]
  for tri in v[ts]:
   hits=[]
   for j in range(3):
    a,b=tri[j],tri[(j+1)%3]
    if (a[2]-z)*(b[2]-z)<0:
     t=(z-a[2])/(b[2]-a[2]);hits.append((a+(b-a)*t)[:2])
   if len(hits)==2:seg.append(hits)
  ax.add_collection(LineCollection(seg,colors='#805332',linewidths=1.2));ax.autoscale();ax.set_aspect('equal');ax.grid(alpha=.25);ax.set_title(f'{side} Z={z:.2f}')
  data[side].append({'z':z,'segments':np.array(seg).tolist()})
  if side=='right':
   center=(.074,.568)
   for rad,col in [(.025,'blue'),(.0345,'red')]:ax.add_patch(plt.Circle(center,rad,fill=False,color=col,linewidth=1))
  else:
   # Original shaft PCA center at each actual Z plane.
   center=(.485+(.010667/.957)*(z+.04),.895+(-.28989/.957)*(z+.04))
   for rad,col in [(.0345,'blue'),(.055,'red')]:ax.add_patch(plt.Circle(center,rad,fill=False,color=col,linewidth=1))
  ax.plot(*center,'ko',ms=3)
fig.tight_layout();fig.savefig(p/'grip-sections.png',dpi=170);(p/'grip-sections.json').write_text(json.dumps(data,indent=2))
