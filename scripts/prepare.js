// app/ فولڈر سے www/ بناتا ہے اور PDF کی لائبریریاں ایپ کے اندر رکھتا ہے (آف لائن کے لیے)
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),app=path.join(root,'app'),www=path.join(root,'www');
fs.rmSync(www,{recursive:true,force:true});
fs.cpSync(app,www,{recursive:true});
fs.mkdirSync(path.join(www,'lib'),{recursive:true});
const libs=[['html2canvas/dist/html2canvas.min.js','html2canvas.min.js'],['jspdf/dist/jspdf.umd.min.js','jspdf.umd.min.js']];
for(const [from,to] of libs){
  const src=path.join(root,'node_modules',from);
  if(!fs.existsSync(src)){console.error('Library not found: '+from);process.exit(1)}
  fs.copyFileSync(src,path.join(www,'lib',to));
}
try{fs.rmSync(path.join(www,'sw.js'))}catch(e){}
console.log('www ready:',fs.readdirSync(www).join(', '));
