import base64,os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda p:open(os.path.join(d,p),encoding='utf8').read()
b64=lambda p,m:'data:%s;base64,%s'%(m,base64.b64encode(open(os.path.join(d,p),'rb').read()).decode())
js='\n'.join(r('src/'+f) for f in ['i18n.js','doct.js','ext.js','core.js','docs.js','views.js'])
out=('<title>4V Manutencoes</title>\n'
 '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Atkinson+Hyperlegible:wght@400;700&display=swap">\n'
 '<style>\n'+r('src/style.css')+'\n</style>\n'+r('src/shell.html')+'<script>\n(function(){\n"use strict";\n'+js+'\n})();\n</script>\n')
out=out.replace('__LOGO__',b64('logo_k.png','image/png')).replace('__PHOTO__',b64('valdir_bw.jpg','image/jpeg'))
os.makedirs(os.path.join(d,'build'),exist_ok=True)
open(os.path.join(d,'build/index.html'),'w',encoding='utf8').write(out)
print(len(out.encode('utf8')),'bytes')
