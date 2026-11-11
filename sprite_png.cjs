// Minimal lossless PNG I/O for 8-bit RGB terrain and RGBA sprite sheets.
const fs = require('fs'), zlib = require('zlib'), assert = require('assert');
function read(file) {
  const b=fs.readFileSync(file), width=b.readUInt32BE(16), height=b.readUInt32BE(20);
  assert(b[24]===8 && [2,6].includes(b[25]) && b[28]===0, 'Expected noninterlaced RGB/RGBA PNG');
  const channels=b[25]===6?4:3;
  const chunks=[];
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p),type=b.toString('ascii',p+4,p+8);if(type==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)), stride=width*channels, data=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)]; assert(filter<=4);
    for(let x=0;x<stride;x++){
      const i=y*stride+x, a=x>=channels?data[i-channels]:0, c=x>=channels&&y?data[i-stride-channels]:0, up=y?data[i-stride]:0;
      const p=a+up-c, pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c);
      const predictor=[0,a,up,Math.floor((a+up)/2),pa<=pb&&pa<=pc?a:pb<=pc?up:c][filter];
      data[i]=(raw[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  if(channels===4)return {width,height,data};
  const rgba=Buffer.alloc(width*height*4);
  for(let i=0,j=0;i<data.length;i+=3,j+=4){data.copy(rgba,j,i,i+3);rgba[j+3]=255;}
  return {width,height,data:rgba};
}
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function write(file,im){
  const chunk=(type,data)=>{const t=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,data])),data.length+8);return out;};
  const head=Buffer.alloc(13);head.writeUInt32BE(im.width);head.writeUInt32BE(im.height,4);head[8]=8;head[9]=6;
  const raw=Buffer.alloc((im.width*4+1)*im.height);
  for(let y=0;y<im.height;y++)im.data.copy(raw,y*(im.width*4+1)+1,y*im.width*4,(y+1)*im.width*4);
  fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
}
function blank(width,height,color=[0,0,0,0]){const data=Buffer.alloc(width*height*4);for(let i=0;i<data.length;i+=4)data.set(color,i);return {width,height,data};}
function bounds(im,x=0,y=0,w=im.width,h=im.height){let l=x+w,t=y+h,r=x,b=y;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(im.data[(yy*im.width+xx)*4+3]){l=Math.min(l,xx);t=Math.min(t,yy);r=Math.max(r,xx+1);b=Math.max(b,yy+1);}return r>l?[l,t,r,b]:null;}
function blit(dst,src,box,x,y,width=box[2]-box[0],height=box[3]-box[1]){
  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
    if(x+xx<0||y+yy<0||x+xx>=dst.width||y+yy>=dst.height)continue;
    const sx=box[0]+Math.floor(xx*(box[2]-box[0])/width),sy=box[1]+Math.floor(yy*(box[3]-box[1])/height),i=(sy*src.width+sx)*4,j=((y+yy)*dst.width+x+xx)*4;
    const a=src.data[i+3]/255;if(!a)continue;
    const da=dst.data[j+3]/255,oa=a+da*(1-a);
    for(let k=0;k<3;k++)dst.data[j+k]=Math.round((src.data[i+k]*a+dst.data[j+k]*da*(1-a))/oa);
    dst.data[j+3]=Math.round(oa*255);
  }
}
module.exports={read,write,blank,bounds,blit};
