var ph=Object.defineProperty;var mh=(i,t,e)=>t in i?ph(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var j=(i,t,e)=>mh(i,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const io="169",Ti={ROTATE:0,DOLLY:1,PAN:2},bi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},gh=0,Go=1,_h=2,pc=1,mc=2,En=3,Hn=0,Le=1,nn=2,wn=0,Ai=1,oa=2,Vo=3,Wo=4,vh=5,ti=100,xh=101,Mh=102,yh=103,Sh=104,Eh=200,bh=201,wh=202,Th=203,la=204,ca=205,Ah=206,Ch=207,Rh=208,Ph=209,Ih=210,Lh=211,Dh=212,Uh=213,Nh=214,ha=0,da=1,ua=2,Pi=3,fa=4,pa=5,ma=6,ga=7,gc=0,Fh=1,Oh=2,zn=0,_c=1,vc=2,xc=3,so=4,kh=5,Mc=6,yc=7,Sc=300,Ii=301,Li=302,_a=303,va=304,cr=306,Di=1e3,ni=1001,xa=1002,ke=1003,Bh=1004,ms=1005,sn=1006,Mr=1007,ii=1008,Cn=1009,Ec=1010,bc=1011,as=1012,ro=1013,si=1014,dn=1015,Tn=1016,ao=1017,oo=1018,Ui=1020,wc=35902,Tc=1021,Ac=1022,an=1023,Cc=1024,Rc=1025,Ci=1026,Ni=1027,lo=1028,co=1029,Pc=1030,ho=1031,uo=1033,Ks=33776,$s=33777,qs=33778,Zs=33779,Ma=35840,ya=35841,Sa=35842,Ea=35843,ba=36196,wa=37492,Ta=37496,Aa=37808,Ca=37809,Ra=37810,Pa=37811,Ia=37812,La=37813,Da=37814,Ua=37815,Na=37816,Fa=37817,Oa=37818,ka=37819,Ba=37820,za=37821,js=36492,Ha=36494,Ga=36495,Ic=36283,Va=36284,Wa=36285,Xa=36286,zh=3200,Hh=3201,Lc=0,Gh=1,Bn="",en="srgb",Vn="srgb-linear",fo="display-p3",hr="display-p3-linear",er="linear",ce="srgb",nr="rec709",ir="p3",li=7680,Xo=519,Vh=512,Wh=513,Xh=514,Dc=515,Yh=516,Kh=517,$h=518,qh=519,Yo=35044,Ko="300 es",bn=2e3,sr=2001;class ri{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const Ae=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ns=Math.PI/180,Ya=180/Math.PI;function hs(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ae[i&255]+Ae[i>>8&255]+Ae[i>>16&255]+Ae[i>>24&255]+"-"+Ae[t&255]+Ae[t>>8&255]+"-"+Ae[t>>16&15|64]+Ae[t>>24&255]+"-"+Ae[e&63|128]+Ae[e>>8&255]+"-"+Ae[e>>16&255]+Ae[e>>24&255]+Ae[n&255]+Ae[n>>8&255]+Ae[n>>16&255]+Ae[n>>24&255]).toLowerCase()}function Me(i,t,e){return Math.max(t,Math.min(e,i))}function Zh(i,t){return(i%t+t)%t}function yr(i,t,e){return(1-e)*i+e*t}function Wi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Fe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const jh={DEG2RAD:ns};class tt{constructor(t=0,e=0){tt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Me(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bt{constructor(t,e,n,s,r,a,o,l,c){Bt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],m=n[5],g=n[8],v=s[0],p=s[3],f=s[6],y=s[1],M=s[4],b=s[7],R=s[2],A=s[5],T=s[8];return r[0]=a*v+o*y+l*R,r[3]=a*p+o*M+l*A,r[6]=a*f+o*b+l*T,r[1]=c*v+h*y+d*R,r[4]=c*p+h*M+d*A,r[7]=c*f+h*b+d*T,r[2]=u*v+m*y+g*R,r[5]=u*p+m*M+g*A,r[8]=u*f+m*b+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*a-o*c,u=o*l-h*r,m=c*r-a*l,g=e*d+n*u+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=d*v,t[1]=(s*c-h*n)*v,t[2]=(o*n-s*a)*v,t[3]=u*v,t[4]=(h*e-s*l)*v,t[5]=(s*r-o*e)*v,t[6]=m*v,t[7]=(n*l-c*e)*v,t[8]=(a*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Sr.makeScale(t,e)),this}rotate(t){return this.premultiply(Sr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Sr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Sr=new Bt;function Uc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function rr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Jh(){const i=rr("canvas");return i.style.display="block",i}const $o={};function Js(i){i in $o||($o[i]=!0,console.warn(i))}function Qh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function td(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function ed(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const qo=new Bt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Zo=new Bt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Xi={[Vn]:{transfer:er,primaries:nr,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i,fromReference:i=>i},[en]:{transfer:ce,primaries:nr,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[hr]:{transfer:er,primaries:ir,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.applyMatrix3(Zo),fromReference:i=>i.applyMatrix3(qo)},[fo]:{transfer:ce,primaries:ir,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.convertSRGBToLinear().applyMatrix3(Zo),fromReference:i=>i.applyMatrix3(qo).convertLinearToSRGB()}},nd=new Set([Vn,hr]),Jt={enabled:!0,_workingColorSpace:Vn,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!nd.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=Xi[t].toReference,s=Xi[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return Xi[i].primaries},getTransfer:function(i){return i===Bn?er:Xi[i].transfer},getLuminanceCoefficients:function(i,t=this._workingColorSpace){return i.fromArray(Xi[t].luminanceCoefficients)}};function Ri(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Er(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let ci;class id{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ci===void 0&&(ci=rr("canvas")),ci.width=t.width,ci.height=t.height;const n=ci.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=ci}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=rr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Ri(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ri(e[n]/255)*255):e[n]=Ri(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let sd=0;class Nc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:sd++}),this.uuid=hs(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(br(s[a].image)):r.push(br(s[a]))}else r=br(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function br(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?id.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let rd=0;class Pe extends ri{constructor(t=Pe.DEFAULT_IMAGE,e=Pe.DEFAULT_MAPPING,n=ni,s=ni,r=sn,a=ii,o=an,l=Cn,c=Pe.DEFAULT_ANISOTROPY,h=Bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:rd++}),this.uuid=hs(),this.name="",this.source=new Nc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new tt(0,0),this.repeat=new tt(1,1),this.center=new tt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Bt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Sc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Di:t.x=t.x-Math.floor(t.x);break;case ni:t.x=t.x<0?0:1;break;case xa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Di:t.y=t.y-Math.floor(t.y);break;case ni:t.y=t.y<0?0:1;break;case xa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Pe.DEFAULT_IMAGE=null;Pe.DEFAULT_MAPPING=Sc;Pe.DEFAULT_ANISOTROPY=1;class ae{constructor(t=0,e=0,n=0,s=1){ae.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],m=l[5],g=l[9],v=l[2],p=l[6],f=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+v)<.1&&Math.abs(g+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,b=(m+1)/2,R=(f+1)/2,A=(h+u)/4,T=(d+v)/4,P=(g+p)/4;return M>b&&M>R?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=A/n,r=T/n):b>R?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=A/s,r=P/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=T/r,s=P/r),this.set(n,s,r,e),this}let y=Math.sqrt((p-g)*(p-g)+(d-v)*(d-v)+(u-h)*(u-h));return Math.abs(y)<.001&&(y=1),this.x=(p-g)/y,this.y=(d-v)/y,this.z=(u-h)/y,this.w=Math.acos((c+m+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ad extends ri{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ae(0,0,t,e),this.scissorTest=!1,this.viewport=new ae(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:sn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Pe(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Nc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ln extends ad{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Fc extends Pe{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=ni,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class od extends Pe{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=ni,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Gn{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3];const u=r[a+0],m=r[a+1],g=r[a+2],v=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=u,t[e+1]=m,t[e+2]=g,t[e+3]=v;return}if(d!==v||l!==u||c!==m||h!==g){let p=1-o;const f=l*u+c*m+h*g+d*v,y=f>=0?1:-1,M=1-f*f;if(M>Number.EPSILON){const R=Math.sqrt(M),A=Math.atan2(R,f*y);p=Math.sin(p*A)/R,o=Math.sin(o*A)/R}const b=o*y;if(l=l*p+u*b,c=c*p+m*b,h=h*p+g*b,d=d*p+v*b,p===1-o){const R=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=R,c*=R,h*=R,d*=R}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=r[a],u=r[a+1],m=r[a+2],g=r[a+3];return t[e]=o*g+h*d+l*m-c*u,t[e+1]=l*g+h*u+c*d-o*m,t[e+2]=c*g+h*m+o*u-l*d,t[e+3]=h*g-o*d-l*u-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),d=o(r/2),u=l(n/2),m=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d-u*m*g;break;case"YXZ":this._x=u*h*d+c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d+u*m*g;break;case"ZXY":this._x=u*h*d-c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d-u*m*g;break;case"ZYX":this._x=u*h*d-c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d+u*m*g;break;case"YZX":this._x=u*h*d+c*m*g,this._y=c*m*d+u*h*g,this._z=c*h*g-u*m*d,this._w=c*h*d-u*m*g;break;case"XZY":this._x=u*h*d-c*m*g,this._y=c*m*d-u*h*g,this._z=c*h*g+u*m*d,this._w=c*h*d+u*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+o+d;if(u>0){const m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(h-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>d){const m=2*Math.sqrt(1+n-o-d);this._w=(h-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>d){const m=2*Math.sqrt(1+o-n-d);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+h)/m}else{const m=2*Math.sqrt(1+d-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Me(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const m=1-e;return this._w=m*a+e*this._w,this._x=m*n+e*this._x,this._y=m*s+e*this._y,this._z=m*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=a*d+this._w*u,this._x=n*d+this._x*u,this._y=s*d+this._y*u,this._z=r*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class w{constructor(t=0,e=0,n=0){w.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(jo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(jo.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return wr.copy(this).projectOnVector(t),this.sub(wr)}reflect(t){return this.sub(wr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Me(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const wr=new w,jo=new Gn;class fn{constructor(t=new w(1/0,1/0,1/0),e=new w(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Je.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Je.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Je.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Je):Je.fromBufferAttribute(r,a),Je.applyMatrix4(t.matrixWorld),this.expandByPoint(Je);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),gs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),gs.copy(n.boundingBox)),gs.applyMatrix4(t.matrixWorld),this.union(gs)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Je),Je.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Yi),_s.subVectors(this.max,Yi),hi.subVectors(t.a,Yi),di.subVectors(t.b,Yi),ui.subVectors(t.c,Yi),In.subVectors(di,hi),Ln.subVectors(ui,di),Yn.subVectors(hi,ui);let e=[0,-In.z,In.y,0,-Ln.z,Ln.y,0,-Yn.z,Yn.y,In.z,0,-In.x,Ln.z,0,-Ln.x,Yn.z,0,-Yn.x,-In.y,In.x,0,-Ln.y,Ln.x,0,-Yn.y,Yn.x,0];return!Tr(e,hi,di,ui,_s)||(e=[1,0,0,0,1,0,0,0,1],!Tr(e,hi,di,ui,_s))?!1:(vs.crossVectors(In,Ln),e=[vs.x,vs.y,vs.z],Tr(e,hi,di,ui,_s))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Je).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Je).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(vn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),vn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),vn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),vn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),vn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),vn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),vn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),vn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(vn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const vn=[new w,new w,new w,new w,new w,new w,new w,new w],Je=new w,gs=new fn,hi=new w,di=new w,ui=new w,In=new w,Ln=new w,Yn=new w,Yi=new w,_s=new w,vs=new w,Kn=new w;function Tr(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Kn.fromArray(i,r);const o=s.x*Math.abs(Kn.x)+s.y*Math.abs(Kn.y)+s.z*Math.abs(Kn.z),l=t.dot(Kn),c=e.dot(Kn),h=n.dot(Kn);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const ld=new fn,Ki=new w,Ar=new w;class ai{constructor(t=new w,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):ld.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ki.subVectors(t,this.center);const e=Ki.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ki,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ar.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ki.copy(t.center).add(Ar)),this.expandByPoint(Ki.copy(t.center).sub(Ar))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const xn=new w,Cr=new w,xs=new w,Dn=new w,Rr=new w,Ms=new w,Pr=new w;class ds{constructor(t=new w,e=new w(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,xn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=xn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(xn.copy(this.origin).addScaledVector(this.direction,e),xn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Cr.copy(t).add(e).multiplyScalar(.5),xs.copy(e).sub(t).normalize(),Dn.copy(this.origin).sub(Cr);const r=t.distanceTo(e)*.5,a=-this.direction.dot(xs),o=Dn.dot(this.direction),l=-Dn.dot(xs),c=Dn.lengthSq(),h=Math.abs(1-a*a);let d,u,m,g;if(h>0)if(d=a*l-o,u=a*o-l,g=r*h,d>=0)if(u>=-g)if(u<=g){const v=1/h;d*=v,u*=v,m=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),m=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),m=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),m=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-r,-l),r),m=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),m=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),m=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Cr).addScaledVector(xs,u),m}intersectSphere(t,e){xn.subVectors(t.center,this.origin);const n=xn.dot(this.direction),s=xn.dot(xn)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,xn)!==null}intersectTriangle(t,e,n,s,r){Rr.subVectors(e,t),Ms.subVectors(n,t),Pr.crossVectors(Rr,Ms);let a=this.direction.dot(Pr),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Dn.subVectors(this.origin,t);const l=o*this.direction.dot(Ms.crossVectors(Dn,Ms));if(l<0)return null;const c=o*this.direction.dot(Rr.cross(Dn));if(c<0||l+c>a)return null;const h=-o*Dn.dot(Pr);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Vt{constructor(t,e,n,s,r,a,o,l,c,h,d,u,m,g,v,p){Vt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,d,u,m,g,v,p)}set(t,e,n,s,r,a,o,l,c,h,d,u,m,g,v,p){const f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=d,f[14]=u,f[3]=m,f[7]=g,f[11]=v,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Vt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/fi.setFromMatrixColumn(t,0).length(),r=1/fi.setFromMatrixColumn(t,1).length(),a=1/fi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const u=a*h,m=a*d,g=o*h,v=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=m+g*c,e[5]=u-v*c,e[9]=-o*l,e[2]=v-u*c,e[6]=g+m*c,e[10]=a*l}else if(t.order==="YXZ"){const u=l*h,m=l*d,g=c*h,v=c*d;e[0]=u+v*o,e[4]=g*o-m,e[8]=a*c,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=m*o-g,e[6]=v+u*o,e[10]=a*l}else if(t.order==="ZXY"){const u=l*h,m=l*d,g=c*h,v=c*d;e[0]=u-v*o,e[4]=-a*d,e[8]=g+m*o,e[1]=m+g*o,e[5]=a*h,e[9]=v-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const u=a*h,m=a*d,g=o*h,v=o*d;e[0]=l*h,e[4]=g*c-m,e[8]=u*c+v,e[1]=l*d,e[5]=v*c+u,e[9]=m*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const u=a*l,m=a*c,g=o*l,v=o*c;e[0]=l*h,e[4]=v-u*d,e[8]=g*d+m,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=m*d+g,e[10]=u-v*d}else if(t.order==="XZY"){const u=a*l,m=a*c,g=o*l,v=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+v,e[5]=a*h,e[9]=m*d-g,e[2]=g*d-m,e[6]=o*h,e[10]=v*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(cd,t,hd)}lookAt(t,e,n){const s=this.elements;return Ve.subVectors(t,e),Ve.lengthSq()===0&&(Ve.z=1),Ve.normalize(),Un.crossVectors(n,Ve),Un.lengthSq()===0&&(Math.abs(n.z)===1?Ve.x+=1e-4:Ve.z+=1e-4,Ve.normalize(),Un.crossVectors(n,Ve)),Un.normalize(),ys.crossVectors(Ve,Un),s[0]=Un.x,s[4]=ys.x,s[8]=Ve.x,s[1]=Un.y,s[5]=ys.y,s[9]=Ve.y,s[2]=Un.z,s[6]=ys.z,s[10]=Ve.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],m=n[13],g=n[2],v=n[6],p=n[10],f=n[14],y=n[3],M=n[7],b=n[11],R=n[15],A=s[0],T=s[4],P=s[8],z=s[12],_=s[1],E=s[5],O=s[9],H=s[13],X=s[2],Z=s[6],G=s[10],J=s[14],W=s[3],ut=s[7],ft=s[11],yt=s[15];return r[0]=a*A+o*_+l*X+c*W,r[4]=a*T+o*E+l*Z+c*ut,r[8]=a*P+o*O+l*G+c*ft,r[12]=a*z+o*H+l*J+c*yt,r[1]=h*A+d*_+u*X+m*W,r[5]=h*T+d*E+u*Z+m*ut,r[9]=h*P+d*O+u*G+m*ft,r[13]=h*z+d*H+u*J+m*yt,r[2]=g*A+v*_+p*X+f*W,r[6]=g*T+v*E+p*Z+f*ut,r[10]=g*P+v*O+p*G+f*ft,r[14]=g*z+v*H+p*J+f*yt,r[3]=y*A+M*_+b*X+R*W,r[7]=y*T+M*E+b*Z+R*ut,r[11]=y*P+M*O+b*G+R*ft,r[15]=y*z+M*H+b*J+R*yt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],m=t[14],g=t[3],v=t[7],p=t[11],f=t[15];return g*(+r*l*d-s*c*d-r*o*u+n*c*u+s*o*m-n*l*m)+v*(+e*l*m-e*c*u+r*a*u-s*a*m+s*c*h-r*l*h)+p*(+e*c*d-e*o*m-r*a*d+n*a*m+r*o*h-n*c*h)+f*(-s*o*h-e*l*d+e*o*u+s*a*d-n*a*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],m=t[11],g=t[12],v=t[13],p=t[14],f=t[15],y=d*p*c-v*u*c+v*l*m-o*p*m-d*l*f+o*u*f,M=g*u*c-h*p*c-g*l*m+a*p*m+h*l*f-a*u*f,b=h*v*c-g*d*c+g*o*m-a*v*m-h*o*f+a*d*f,R=g*d*l-h*v*l-g*o*u+a*v*u+h*o*p-a*d*p,A=e*y+n*M+s*b+r*R;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/A;return t[0]=y*T,t[1]=(v*u*r-d*p*r-v*s*m+n*p*m+d*s*f-n*u*f)*T,t[2]=(o*p*r-v*l*r+v*s*c-n*p*c-o*s*f+n*l*f)*T,t[3]=(d*l*r-o*u*r-d*s*c+n*u*c+o*s*m-n*l*m)*T,t[4]=M*T,t[5]=(h*p*r-g*u*r+g*s*m-e*p*m-h*s*f+e*u*f)*T,t[6]=(g*l*r-a*p*r-g*s*c+e*p*c+a*s*f-e*l*f)*T,t[7]=(a*u*r-h*l*r+h*s*c-e*u*c-a*s*m+e*l*m)*T,t[8]=b*T,t[9]=(g*d*r-h*v*r-g*n*m+e*v*m+h*n*f-e*d*f)*T,t[10]=(a*v*r-g*o*r+g*n*c-e*v*c-a*n*f+e*o*f)*T,t[11]=(h*o*r-a*d*r-h*n*c+e*d*c+a*n*m-e*o*m)*T,t[12]=R*T,t[13]=(h*v*s-g*d*s+g*n*u-e*v*u-h*n*p+e*d*p)*T,t[14]=(g*o*s-a*v*s-g*n*l+e*v*l+a*n*p-e*o*p)*T,t[15]=(a*d*s-h*o*s+h*n*l-e*d*l-a*n*u+e*o*u)*T,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,d=o+o,u=r*c,m=r*h,g=r*d,v=a*h,p=a*d,f=o*d,y=l*c,M=l*h,b=l*d,R=n.x,A=n.y,T=n.z;return s[0]=(1-(v+f))*R,s[1]=(m+b)*R,s[2]=(g-M)*R,s[3]=0,s[4]=(m-b)*A,s[5]=(1-(u+f))*A,s[6]=(p+y)*A,s[7]=0,s[8]=(g+M)*T,s[9]=(p-y)*T,s[10]=(1-(u+v))*T,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=fi.set(s[0],s[1],s[2]).length();const a=fi.set(s[4],s[5],s[6]).length(),o=fi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Qe.copy(this);const c=1/r,h=1/a,d=1/o;return Qe.elements[0]*=c,Qe.elements[1]*=c,Qe.elements[2]*=c,Qe.elements[4]*=h,Qe.elements[5]*=h,Qe.elements[6]*=h,Qe.elements[8]*=d,Qe.elements[9]*=d,Qe.elements[10]*=d,e.setFromRotationMatrix(Qe),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=bn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-s),d=(e+t)/(e-t),u=(n+s)/(n-s);let m,g;if(o===bn)m=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===sr)m=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=bn){const l=this.elements,c=1/(e-t),h=1/(n-s),d=1/(a-r),u=(e+t)*c,m=(n+s)*h;let g,v;if(o===bn)g=(a+r)*d,v=-2*d;else if(o===sr)g=r*d,v=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const fi=new w,Qe=new Vt,cd=new w(0,0,0),hd=new w(1,1,1),Un=new w,ys=new w,Ve=new w,Jo=new Vt,Qo=new Gn;class pn{constructor(t=0,e=0,n=0,s=pn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(Me(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Me(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Me(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Me(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Me(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Me(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Jo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Jo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Qo.setFromEuler(this),this.setFromQuaternion(Qo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}pn.DEFAULT_ORDER="XYZ";class po{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let dd=0;const tl=new w,pi=new Gn,Mn=new Vt,Ss=new w,$i=new w,ud=new w,fd=new Gn,el=new w(1,0,0),nl=new w(0,1,0),il=new w(0,0,1),sl={type:"added"},pd={type:"removed"},mi={type:"childadded",child:null},Ir={type:"childremoved",child:null};class ye extends ri{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:dd++}),this.uuid=hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ye.DEFAULT_UP.clone();const t=new w,e=new pn,n=new Gn,s=new w(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Vt},normalMatrix:{value:new Bt}}),this.matrix=new Vt,this.matrixWorld=new Vt,this.matrixAutoUpdate=ye.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new po,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.multiply(pi),this}rotateOnWorldAxis(t,e){return pi.setFromAxisAngle(t,e),this.quaternion.premultiply(pi),this}rotateX(t){return this.rotateOnAxis(el,t)}rotateY(t){return this.rotateOnAxis(nl,t)}rotateZ(t){return this.rotateOnAxis(il,t)}translateOnAxis(t,e){return tl.copy(t).applyQuaternion(this.quaternion),this.position.add(tl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(el,t)}translateY(t){return this.translateOnAxis(nl,t)}translateZ(t){return this.translateOnAxis(il,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Mn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ss.copy(t):Ss.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),$i.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Mn.lookAt($i,Ss,this.up):Mn.lookAt(Ss,$i,this.up),this.quaternion.setFromRotationMatrix(Mn),s&&(Mn.extractRotation(s.matrixWorld),pi.setFromRotationMatrix(Mn),this.quaternion.premultiply(pi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(sl),mi.child=t,this.dispatchEvent(mi),mi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(pd),Ir.child=t,this.dispatchEvent(Ir),Ir.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Mn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Mn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Mn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(sl),mi.child=t,this.dispatchEvent(mi),mi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,t,ud),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,fd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),d=a(t.shapes),u=a(t.skeletons),m=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}ye.DEFAULT_UP=new w(0,1,0);ye.DEFAULT_MATRIX_AUTO_UPDATE=!0;ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const tn=new w,yn=new w,Lr=new w,Sn=new w,gi=new w,_i=new w,rl=new w,Dr=new w,Ur=new w,Nr=new w,Fr=new ae,Or=new ae,kr=new ae;class qe{constructor(t=new w,e=new w,n=new w){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),tn.subVectors(t,e),s.cross(tn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){tn.subVectors(s,e),yn.subVectors(n,e),Lr.subVectors(t,e);const a=tn.dot(tn),o=tn.dot(yn),l=tn.dot(Lr),c=yn.dot(yn),h=yn.dot(Lr),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;const u=1/d,m=(c*l-o*h)*u,g=(a*h-o*l)*u;return r.set(1-m-g,g,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Sn)===null?!1:Sn.x>=0&&Sn.y>=0&&Sn.x+Sn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Sn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Sn.x),l.addScaledVector(a,Sn.y),l.addScaledVector(o,Sn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Fr.setScalar(0),Or.setScalar(0),kr.setScalar(0),Fr.fromBufferAttribute(t,e),Or.fromBufferAttribute(t,n),kr.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Fr,r.x),a.addScaledVector(Or,r.y),a.addScaledVector(kr,r.z),a}static isFrontFacing(t,e,n,s){return tn.subVectors(n,e),yn.subVectors(t,e),tn.cross(yn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return tn.subVectors(this.c,this.b),yn.subVectors(this.a,this.b),tn.cross(yn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return qe.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return qe.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return qe.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return qe.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return qe.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;gi.subVectors(s,n),_i.subVectors(r,n),Dr.subVectors(t,n);const l=gi.dot(Dr),c=_i.dot(Dr);if(l<=0&&c<=0)return e.copy(n);Ur.subVectors(t,s);const h=gi.dot(Ur),d=_i.dot(Ur);if(h>=0&&d<=h)return e.copy(s);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(gi,a);Nr.subVectors(t,r);const m=gi.dot(Nr),g=_i.dot(Nr);if(g>=0&&m<=g)return e.copy(r);const v=m*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(_i,o);const p=h*g-m*d;if(p<=0&&d-h>=0&&m-g>=0)return rl.subVectors(r,s),o=(d-h)/(d-h+(m-g)),e.copy(s).addScaledVector(rl,o);const f=1/(p+v+u);return a=v*f,o=u*f,e.copy(n).addScaledVector(gi,a).addScaledVector(_i,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Oc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Nn={h:0,s:0,l:0},Es={h:0,s:0,l:0};function Br(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class ot{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=en){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Jt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Jt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Jt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Jt.workingColorSpace){if(t=Zh(t,1),e=Me(e,0,1),n=Me(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Br(a,r,t+1/3),this.g=Br(a,r,t),this.b=Br(a,r,t-1/3)}return Jt.toWorkingColorSpace(this,s),this}setStyle(t,e=en){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=en){const n=Oc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ri(t.r),this.g=Ri(t.g),this.b=Ri(t.b),this}copyLinearToSRGB(t){return this.r=Er(t.r),this.g=Er(t.g),this.b=Er(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=en){return Jt.fromWorkingColorSpace(Ce.copy(this),t),Math.round(Me(Ce.r*255,0,255))*65536+Math.round(Me(Ce.g*255,0,255))*256+Math.round(Me(Ce.b*255,0,255))}getHexString(t=en){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Jt.workingColorSpace){Jt.fromWorkingColorSpace(Ce.copy(this),e);const n=Ce.r,s=Ce.g,r=Ce.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Jt.workingColorSpace){return Jt.fromWorkingColorSpace(Ce.copy(this),e),t.r=Ce.r,t.g=Ce.g,t.b=Ce.b,t}getStyle(t=en){Jt.fromWorkingColorSpace(Ce.copy(this),t);const e=Ce.r,n=Ce.g,s=Ce.b;return t!==en?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Nn),this.setHSL(Nn.h+t,Nn.s+e,Nn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Nn),t.getHSL(Es);const n=yr(Nn.h,Es.h,e),s=yr(Nn.s,Es.s,e),r=yr(Nn.l,Es.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ce=new ot;ot.NAMES=Oc;let md=0;class Wn extends ri{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:md++}),this.uuid=hs(),this.name="",this.type="Material",this.blending=Ai,this.side=Hn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=la,this.blendDst=ca,this.blendEquation=ti,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ot(0,0,0),this.blendAlpha=0,this.depthFunc=Pi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Xo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=li,this.stencilZFail=li,this.stencilZPass=li,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Ai&&(n.blending=this.blending),this.side!==Hn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==la&&(n.blendSrc=this.blendSrc),this.blendDst!==ca&&(n.blendDst=this.blendDst),this.blendEquation!==ti&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Pi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Xo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==li&&(n.stencilFail=this.stencilFail),this.stencilZFail!==li&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==li&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class dr extends Wn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ot(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.combine=gc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ve=new w,bs=new tt;class Be{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Yo,this.updateRanges=[],this.gpuType=dn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)bs.fromBufferAttribute(this,e),bs.applyMatrix3(t),this.setXY(e,bs.x,bs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix3(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyMatrix4(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.applyNormalMatrix(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ve.fromBufferAttribute(this,e),ve.transformDirection(t),this.setXYZ(e,ve.x,ve.y,ve.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Wi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Fe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Wi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Wi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Wi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Wi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Fe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array),s=Fe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Fe(e,this.array),n=Fe(n,this.array),s=Fe(s,this.array),r=Fe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Yo&&(t.usage=this.usage),t}}class kc extends Be{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Bc extends Be{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class oe extends Be{constructor(t,e,n){super(new Float32Array(t),e,n)}}let gd=0;const $e=new Vt,zr=new ye,vi=new w,We=new fn,qi=new fn,we=new w;class Se extends ri{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:gd++}),this.uuid=hs(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Uc(t)?Bc:kc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Bt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return $e.makeRotationFromQuaternion(t),this.applyMatrix4($e),this}rotateX(t){return $e.makeRotationX(t),this.applyMatrix4($e),this}rotateY(t){return $e.makeRotationY(t),this.applyMatrix4($e),this}rotateZ(t){return $e.makeRotationZ(t),this.applyMatrix4($e),this}translate(t,e,n){return $e.makeTranslation(t,e,n),this.applyMatrix4($e),this}scale(t,e,n){return $e.makeScale(t,e,n),this.applyMatrix4($e),this}lookAt(t){return zr.lookAt(t),zr.updateMatrix(),this.applyMatrix4(zr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(vi).negate(),this.translate(vi.x,vi.y,vi.z),this}setFromPoints(t){const e=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new oe(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new fn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new w(-1/0,-1/0,-1/0),new w(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];We.setFromBufferAttribute(r),this.morphTargetsRelative?(we.addVectors(this.boundingBox.min,We.min),this.boundingBox.expandByPoint(we),we.addVectors(this.boundingBox.max,We.max),this.boundingBox.expandByPoint(we)):(this.boundingBox.expandByPoint(We.min),this.boundingBox.expandByPoint(We.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ai);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new w,1/0);return}if(t){const n=this.boundingSphere.center;if(We.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];qi.setFromBufferAttribute(o),this.morphTargetsRelative?(we.addVectors(We.min,qi.min),We.expandByPoint(we),we.addVectors(We.max,qi.max),We.expandByPoint(we)):(We.expandByPoint(qi.min),We.expandByPoint(qi.max))}We.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)we.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(we));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)we.fromBufferAttribute(o,c),l&&(vi.fromBufferAttribute(t,c),we.add(vi)),s=Math.max(s,n.distanceToSquared(we))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Be(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let P=0;P<n.count;P++)o[P]=new w,l[P]=new w;const c=new w,h=new w,d=new w,u=new tt,m=new tt,g=new tt,v=new w,p=new w;function f(P,z,_){c.fromBufferAttribute(n,P),h.fromBufferAttribute(n,z),d.fromBufferAttribute(n,_),u.fromBufferAttribute(r,P),m.fromBufferAttribute(r,z),g.fromBufferAttribute(r,_),h.sub(c),d.sub(c),m.sub(u),g.sub(u);const E=1/(m.x*g.y-g.x*m.y);isFinite(E)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(d,-m.y).multiplyScalar(E),p.copy(d).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(E),o[P].add(v),o[z].add(v),o[_].add(v),l[P].add(p),l[z].add(p),l[_].add(p))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let P=0,z=y.length;P<z;++P){const _=y[P],E=_.start,O=_.count;for(let H=E,X=E+O;H<X;H+=3)f(t.getX(H+0),t.getX(H+1),t.getX(H+2))}const M=new w,b=new w,R=new w,A=new w;function T(P){R.fromBufferAttribute(s,P),A.copy(R);const z=o[P];M.copy(z),M.sub(R.multiplyScalar(R.dot(z))).normalize(),b.crossVectors(A,z);const E=b.dot(l[P])<0?-1:1;a.setXYZW(P,M.x,M.y,M.z,E)}for(let P=0,z=y.length;P<z;++P){const _=y[P],E=_.start,O=_.count;for(let H=E,X=E+O;H<X;H+=3)T(t.getX(H+0)),T(t.getX(H+1)),T(t.getX(H+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Be(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);const s=new w,r=new w,a=new w,o=new w,l=new w,c=new w,h=new w,d=new w;if(t)for(let u=0,m=t.count;u<m;u+=3){const g=t.getX(u+0),v=t.getX(u+1),p=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,p),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,p),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,m=e.count;u<m;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)we.fromBufferAttribute(t,e),we.normalize(),t.setXYZ(e,we.x,we.y,we.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h);let m=0,g=0;for(let v=0,p=l.length;v<p;v++){o.isInterleavedBufferAttribute?m=l[v]*o.data.stride+o.offset:m=l[v]*h;for(let f=0;f<h;f++)u[g++]=c[m++]}return new Be(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Se,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){const u=c[h],m=t(u,n);l.push(m)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const m=c[d];h.push(m.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],d=r[c];for(let u=0,m=d.length;u<m;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const al=new Vt,$n=new ds,ws=new ai,ol=new w,Ts=new w,As=new w,Cs=new w,Hr=new w,Rs=new w,ll=new w,Ps=new w;class Nt extends ye{constructor(t=new Se,e=new dr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){Rs.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],d=r[l];h!==0&&(Hr.fromBufferAttribute(d,t),a?Rs.addScaledVector(Hr,h):Rs.addScaledVector(Hr.sub(e),h))}e.add(Rs)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ws.copy(n.boundingSphere),ws.applyMatrix4(r),$n.copy(t.ray).recast(t.near),!(ws.containsPoint($n.origin)===!1&&($n.intersectSphere(ws,ol)===null||$n.origin.distanceToSquared(ol)>(t.far-t.near)**2))&&(al.copy(r).invert(),$n.copy(t.ray).applyMatrix4(al),!(n.boundingBox!==null&&$n.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,$n)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){const p=u[g],f=a[p.materialIndex],y=Math.max(p.start,m.start),M=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let b=y,R=M;b<R;b+=3){const A=o.getX(b),T=o.getX(b+1),P=o.getX(b+2);s=Is(this,f,t,n,c,h,d,A,T,P),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),v=Math.min(o.count,m.start+m.count);for(let p=g,f=v;p<f;p+=3){const y=o.getX(p),M=o.getX(p+1),b=o.getX(p+2);s=Is(this,a,t,n,c,h,d,y,M,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){const p=u[g],f=a[p.materialIndex],y=Math.max(p.start,m.start),M=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let b=y,R=M;b<R;b+=3){const A=b,T=b+1,P=b+2;s=Is(this,f,t,n,c,h,d,A,T,P),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,m.start),v=Math.min(l.count,m.start+m.count);for(let p=g,f=v;p<f;p+=3){const y=p,M=p+1,b=p+2;s=Is(this,a,t,n,c,h,d,y,M,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}}function _d(i,t,e,n,s,r,a,o){let l;if(t.side===Le?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Hn,o),l===null)return null;Ps.copy(o),Ps.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Ps);return c<e.near||c>e.far?null:{distance:c,point:Ps.clone(),object:i}}function Is(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Ts),i.getVertexPosition(l,As),i.getVertexPosition(c,Cs);const h=_d(i,t,e,n,Ts,As,Cs,ll);if(h){const d=new w;qe.getBarycoord(ll,Ts,As,Cs,d),s&&(h.uv=qe.getInterpolatedAttribute(s,o,l,c,d,new tt)),r&&(h.uv1=qe.getInterpolatedAttribute(r,o,l,c,d,new tt)),a&&(h.normal=qe.getInterpolatedAttribute(a,o,l,c,d,new w),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new w,materialIndex:0};qe.getNormal(Ts,As,Cs,u.normal),h.face=u,h.barycoord=d}return h}class se extends Se{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],d=[];let u=0,m=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new oe(c,3)),this.setAttribute("normal",new oe(h,3)),this.setAttribute("uv",new oe(d,2));function g(v,p,f,y,M,b,R,A,T,P,z){const _=b/T,E=R/P,O=b/2,H=R/2,X=A/2,Z=T+1,G=P+1;let J=0,W=0;const ut=new w;for(let ft=0;ft<G;ft++){const yt=ft*E-H;for(let Zt=0;Zt<Z;Zt++){const ee=Zt*_-O;ut[v]=ee*y,ut[p]=yt*M,ut[f]=X,c.push(ut.x,ut.y,ut.z),ut[v]=0,ut[p]=0,ut[f]=A>0?1:-1,h.push(ut.x,ut.y,ut.z),d.push(Zt/T),d.push(1-ft/P),J+=1}}for(let ft=0;ft<P;ft++)for(let yt=0;yt<T;yt++){const Zt=u+yt+Z*ft,ee=u+yt+Z*(ft+1),Y=u+(yt+1)+Z*(ft+1),et=u+(yt+1)+Z*ft;l.push(Zt,ee,et),l.push(ee,Y,et),W+=6}o.addGroup(m,W,z),m+=W,u+=J}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new se(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Fi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Ie(i){const t={};for(let e=0;e<i.length;e++){const n=Fi(i[e]);for(const s in n)t[s]=n[s]}return t}function vd(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function zc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Jt.workingColorSpace}const os={clone:Fi,merge:Ie};var xd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Md=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Re extends Wn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=xd,this.fragmentShader=Md,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Fi(t.uniforms),this.uniformsGroups=vd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Hc extends ye{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Vt,this.projectionMatrix=new Vt,this.projectionMatrixInverse=new Vt,this.coordinateSystem=bn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Fn=new w,cl=new tt,hl=new tt;class Ye extends Hc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ya*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(ns*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ya*2*Math.atan(Math.tan(ns*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Fn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Fn.x,Fn.y).multiplyScalar(-t/Fn.z),Fn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Fn.x,Fn.y).multiplyScalar(-t/Fn.z)}getViewSize(t,e){return this.getViewBounds(t,cl,hl),e.subVectors(hl,cl)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(ns*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const xi=-90,Mi=1;class yd extends ye{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ye(xi,Mi,t,e);s.layers=this.layers,this.add(s);const r=new Ye(xi,Mi,t,e);r.layers=this.layers,this.add(r);const a=new Ye(xi,Mi,t,e);a.layers=this.layers,this.add(a);const o=new Ye(xi,Mi,t,e);o.layers=this.layers,this.add(o);const l=new Ye(xi,Mi,t,e);l.layers=this.layers,this.add(l);const c=new Ye(xi,Mi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===bn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===sr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(d,u,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Gc extends Pe{constructor(t,e,n,s,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Ii,super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Sd extends ln{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Gc(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:sn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new se(5,5,5),r=new Re({name:"CubemapFromEquirect",uniforms:Fi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Le,blending:wn});r.uniforms.tEquirect.value=e;const a=new Nt(s,r),o=e.minFilter;return e.minFilter===ii&&(e.minFilter=sn),new yd(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}const Gr=new w,Ed=new w,bd=new Bt;class kn{constructor(t=new w(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=Gr.subVectors(n,e).cross(Ed.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Gr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||bd.getNormalMatrix(t),s=this.coplanarPoint(Gr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const qn=new ai,Ls=new w;class mo{constructor(t=new kn,e=new kn,n=new kn,s=new kn,r=new kn,a=new kn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=bn){const n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],d=s[6],u=s[7],m=s[8],g=s[9],v=s[10],p=s[11],f=s[12],y=s[13],M=s[14],b=s[15];if(n[0].setComponents(l-r,u-c,p-m,b-f).normalize(),n[1].setComponents(l+r,u+c,p+m,b+f).normalize(),n[2].setComponents(l+a,u+h,p+g,b+y).normalize(),n[3].setComponents(l-a,u-h,p-g,b-y).normalize(),n[4].setComponents(l-o,u-d,p-v,b-M).normalize(),e===bn)n[5].setComponents(l+o,u+d,p+v,b+M).normalize();else if(e===sr)n[5].setComponents(o,d,v,M).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),qn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),qn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(qn)}intersectsSprite(t){return qn.center.set(0,0,0),qn.radius=.7071067811865476,qn.applyMatrix4(t.matrixWorld),this.intersectsSphere(qn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(Ls.x=s.normal.x>0?t.max.x:t.min.x,Ls.y=s.normal.y>0?t.max.y:t.min.y,Ls.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Ls)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Vc(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function wd(i){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,d=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const h=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,h);else{d.sort((m,g)=>m.start-g.start);let u=0;for(let m=1;m<d.length;m++){const g=d[u],v=d[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,d[u]=v)}d.length=u+1;for(let m=0,g=d.length;m<g;m++){const v=d[m];i.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}class Bi extends Se{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,d=t/o,u=e/l,m=[],g=[],v=[],p=[];for(let f=0;f<h;f++){const y=f*u-a;for(let M=0;M<c;M++){const b=M*d-r;g.push(b,-y,0),v.push(0,0,1),p.push(M/o),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let y=0;y<o;y++){const M=y+c*f,b=y+c*(f+1),R=y+1+c*(f+1),A=y+1+c*f;m.push(M,b,A),m.push(b,R,A)}this.setIndex(m),this.setAttribute("position",new oe(g,3)),this.setAttribute("normal",new oe(v,3)),this.setAttribute("uv",new oe(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Bi(t.width,t.height,t.widthSegments,t.heightSegments)}}var Td=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ad=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Cd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Rd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Id=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ld=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Dd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ud=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Nd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Fd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Od=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,kd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Bd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,zd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Hd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Gd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Vd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Wd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Xd=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Yd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Kd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,$d=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,qd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Zd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,jd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Jd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Qd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,tu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,eu=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,nu="gl_FragColor = linearToOutputTexel( gl_FragColor );",iu=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,su=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,ru=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,au=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ou=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,lu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,cu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,hu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,du=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,uu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,fu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,pu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,mu=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,gu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,_u=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,vu=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,xu=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Mu=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,yu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Su=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Eu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,bu=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,wu=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Tu=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Au=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Cu=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ru=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Pu=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Iu=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Lu=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Du=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Uu=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Nu=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Fu=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ou=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ku=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Bu=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,zu=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Hu=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Gu=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Vu=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Wu=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Xu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Yu=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Ku=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,$u=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qu=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Zu=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ju=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ju=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Qu=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,tf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,ef=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,nf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,sf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,rf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,af=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,of=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,lf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,cf=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,hf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,df=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,uf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ff=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,pf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,mf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,gf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,_f=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,vf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,xf=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Mf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,yf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Sf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ef=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,bf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Tf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Af=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Rf=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Pf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,If=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Lf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Df=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Uf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Nf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Ff=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Of=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,kf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Bf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,zf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Hf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Vf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Wf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Xf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Kf=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,$f=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,jf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jf=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,ep=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,np=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ip=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,kt={alphahash_fragment:Td,alphahash_pars_fragment:Ad,alphamap_fragment:Cd,alphamap_pars_fragment:Rd,alphatest_fragment:Pd,alphatest_pars_fragment:Id,aomap_fragment:Ld,aomap_pars_fragment:Dd,batching_pars_vertex:Ud,batching_vertex:Nd,begin_vertex:Fd,beginnormal_vertex:Od,bsdfs:kd,iridescence_fragment:Bd,bumpmap_pars_fragment:zd,clipping_planes_fragment:Hd,clipping_planes_pars_fragment:Gd,clipping_planes_pars_vertex:Vd,clipping_planes_vertex:Wd,color_fragment:Xd,color_pars_fragment:Yd,color_pars_vertex:Kd,color_vertex:$d,common:qd,cube_uv_reflection_fragment:Zd,defaultnormal_vertex:jd,displacementmap_pars_vertex:Jd,displacementmap_vertex:Qd,emissivemap_fragment:tu,emissivemap_pars_fragment:eu,colorspace_fragment:nu,colorspace_pars_fragment:iu,envmap_fragment:su,envmap_common_pars_fragment:ru,envmap_pars_fragment:au,envmap_pars_vertex:ou,envmap_physical_pars_fragment:vu,envmap_vertex:lu,fog_vertex:cu,fog_pars_vertex:hu,fog_fragment:du,fog_pars_fragment:uu,gradientmap_pars_fragment:fu,lightmap_pars_fragment:pu,lights_lambert_fragment:mu,lights_lambert_pars_fragment:gu,lights_pars_begin:_u,lights_toon_fragment:xu,lights_toon_pars_fragment:Mu,lights_phong_fragment:yu,lights_phong_pars_fragment:Su,lights_physical_fragment:Eu,lights_physical_pars_fragment:bu,lights_fragment_begin:wu,lights_fragment_maps:Tu,lights_fragment_end:Au,logdepthbuf_fragment:Cu,logdepthbuf_pars_fragment:Ru,logdepthbuf_pars_vertex:Pu,logdepthbuf_vertex:Iu,map_fragment:Lu,map_pars_fragment:Du,map_particle_fragment:Uu,map_particle_pars_fragment:Nu,metalnessmap_fragment:Fu,metalnessmap_pars_fragment:Ou,morphinstance_vertex:ku,morphcolor_vertex:Bu,morphnormal_vertex:zu,morphtarget_pars_vertex:Hu,morphtarget_vertex:Gu,normal_fragment_begin:Vu,normal_fragment_maps:Wu,normal_pars_fragment:Xu,normal_pars_vertex:Yu,normal_vertex:Ku,normalmap_pars_fragment:$u,clearcoat_normal_fragment_begin:qu,clearcoat_normal_fragment_maps:Zu,clearcoat_pars_fragment:ju,iridescence_pars_fragment:Ju,opaque_fragment:Qu,packing:tf,premultiplied_alpha_fragment:ef,project_vertex:nf,dithering_fragment:sf,dithering_pars_fragment:rf,roughnessmap_fragment:af,roughnessmap_pars_fragment:of,shadowmap_pars_fragment:lf,shadowmap_pars_vertex:cf,shadowmap_vertex:hf,shadowmask_pars_fragment:df,skinbase_vertex:uf,skinning_pars_vertex:ff,skinning_vertex:pf,skinnormal_vertex:mf,specularmap_fragment:gf,specularmap_pars_fragment:_f,tonemapping_fragment:vf,tonemapping_pars_fragment:xf,transmission_fragment:Mf,transmission_pars_fragment:yf,uv_pars_fragment:Sf,uv_pars_vertex:Ef,uv_vertex:bf,worldpos_vertex:wf,background_vert:Tf,background_frag:Af,backgroundCube_vert:Cf,backgroundCube_frag:Rf,cube_vert:Pf,cube_frag:If,depth_vert:Lf,depth_frag:Df,distanceRGBA_vert:Uf,distanceRGBA_frag:Nf,equirect_vert:Ff,equirect_frag:Of,linedashed_vert:kf,linedashed_frag:Bf,meshbasic_vert:zf,meshbasic_frag:Hf,meshlambert_vert:Gf,meshlambert_frag:Vf,meshmatcap_vert:Wf,meshmatcap_frag:Xf,meshnormal_vert:Yf,meshnormal_frag:Kf,meshphong_vert:$f,meshphong_frag:qf,meshphysical_vert:Zf,meshphysical_frag:jf,meshtoon_vert:Jf,meshtoon_frag:Qf,points_vert:tp,points_frag:ep,shadow_vert:np,shadow_frag:ip,sprite_vert:sp,sprite_frag:rp},rt={common:{diffuse:{value:new ot(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Bt}},envmap:{envMap:{value:null},envMapRotation:{value:new Bt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Bt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Bt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Bt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Bt},normalScale:{value:new tt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Bt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Bt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Bt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Bt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ot(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ot(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0},uvTransform:{value:new Bt}},sprite:{diffuse:{value:new ot(16777215)},opacity:{value:1},center:{value:new tt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}}},hn={basic:{uniforms:Ie([rt.common,rt.specularmap,rt.envmap,rt.aomap,rt.lightmap,rt.fog]),vertexShader:kt.meshbasic_vert,fragmentShader:kt.meshbasic_frag},lambert:{uniforms:Ie([rt.common,rt.specularmap,rt.envmap,rt.aomap,rt.lightmap,rt.emissivemap,rt.bumpmap,rt.normalmap,rt.displacementmap,rt.fog,rt.lights,{emissive:{value:new ot(0)}}]),vertexShader:kt.meshlambert_vert,fragmentShader:kt.meshlambert_frag},phong:{uniforms:Ie([rt.common,rt.specularmap,rt.envmap,rt.aomap,rt.lightmap,rt.emissivemap,rt.bumpmap,rt.normalmap,rt.displacementmap,rt.fog,rt.lights,{emissive:{value:new ot(0)},specular:{value:new ot(1118481)},shininess:{value:30}}]),vertexShader:kt.meshphong_vert,fragmentShader:kt.meshphong_frag},standard:{uniforms:Ie([rt.common,rt.envmap,rt.aomap,rt.lightmap,rt.emissivemap,rt.bumpmap,rt.normalmap,rt.displacementmap,rt.roughnessmap,rt.metalnessmap,rt.fog,rt.lights,{emissive:{value:new ot(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag},toon:{uniforms:Ie([rt.common,rt.aomap,rt.lightmap,rt.emissivemap,rt.bumpmap,rt.normalmap,rt.displacementmap,rt.gradientmap,rt.fog,rt.lights,{emissive:{value:new ot(0)}}]),vertexShader:kt.meshtoon_vert,fragmentShader:kt.meshtoon_frag},matcap:{uniforms:Ie([rt.common,rt.bumpmap,rt.normalmap,rt.displacementmap,rt.fog,{matcap:{value:null}}]),vertexShader:kt.meshmatcap_vert,fragmentShader:kt.meshmatcap_frag},points:{uniforms:Ie([rt.points,rt.fog]),vertexShader:kt.points_vert,fragmentShader:kt.points_frag},dashed:{uniforms:Ie([rt.common,rt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:kt.linedashed_vert,fragmentShader:kt.linedashed_frag},depth:{uniforms:Ie([rt.common,rt.displacementmap]),vertexShader:kt.depth_vert,fragmentShader:kt.depth_frag},normal:{uniforms:Ie([rt.common,rt.bumpmap,rt.normalmap,rt.displacementmap,{opacity:{value:1}}]),vertexShader:kt.meshnormal_vert,fragmentShader:kt.meshnormal_frag},sprite:{uniforms:Ie([rt.sprite,rt.fog]),vertexShader:kt.sprite_vert,fragmentShader:kt.sprite_frag},background:{uniforms:{uvTransform:{value:new Bt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:kt.background_vert,fragmentShader:kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Bt}},vertexShader:kt.backgroundCube_vert,fragmentShader:kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:kt.cube_vert,fragmentShader:kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:kt.equirect_vert,fragmentShader:kt.equirect_frag},distanceRGBA:{uniforms:Ie([rt.common,rt.displacementmap,{referencePosition:{value:new w},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:kt.distanceRGBA_vert,fragmentShader:kt.distanceRGBA_frag},shadow:{uniforms:Ie([rt.lights,rt.fog,{color:{value:new ot(0)},opacity:{value:1}}]),vertexShader:kt.shadow_vert,fragmentShader:kt.shadow_frag}};hn.physical={uniforms:Ie([hn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Bt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Bt},clearcoatNormalScale:{value:new tt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Bt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Bt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Bt},sheen:{value:0},sheenColor:{value:new ot(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Bt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Bt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Bt},transmissionSamplerSize:{value:new tt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Bt},attenuationDistance:{value:0},attenuationColor:{value:new ot(0)},specularColor:{value:new ot(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Bt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Bt},anisotropyVector:{value:new tt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Bt}}]),vertexShader:kt.meshphysical_vert,fragmentShader:kt.meshphysical_frag};const Ds={r:0,b:0,g:0},Zn=new pn,ap=new Vt;function op(i,t,e,n,s,r,a){const o=new ot(0);let l=r===!0?0:1,c,h,d=null,u=0,m=null;function g(y){let M=y.isScene===!0?y.background:null;return M&&M.isTexture&&(M=(y.backgroundBlurriness>0?e:t).get(M)),M}function v(y){let M=!1;const b=g(y);b===null?f(o,l):b&&b.isColor&&(f(b,1),M=!0);const R=i.xr.getEnvironmentBlendMode();R==="additive"?n.buffers.color.setClear(0,0,0,1,a):R==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||M)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(y,M){const b=g(M);b&&(b.isCubeTexture||b.mapping===cr)?(h===void 0&&(h=new Nt(new se(1,1,1),new Re({name:"BackgroundCubeMaterial",uniforms:Fi(hn.backgroundCube.uniforms),vertexShader:hn.backgroundCube.vertexShader,fragmentShader:hn.backgroundCube.fragmentShader,side:Le,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(R,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Zn.copy(M.backgroundRotation),Zn.x*=-1,Zn.y*=-1,Zn.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(Zn.y*=-1,Zn.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(ap.makeRotationFromEuler(Zn)),h.material.toneMapped=Jt.getTransfer(b.colorSpace)!==ce,(d!==b||u!==b.version||m!==i.toneMapping)&&(h.material.needsUpdate=!0,d=b,u=b.version,m=i.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new Nt(new Bi(2,2),new Re({name:"BackgroundMaterial",uniforms:Fi(hn.background.uniforms),vertexShader:hn.background.vertexShader,fragmentShader:hn.background.fragmentShader,side:Hn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=Jt.getTransfer(b.colorSpace)!==ce,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||u!==b.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,d=b,u=b.version,m=i.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function f(y,M){y.getRGB(Ds,zc(i)),n.buffers.color.setClear(Ds.r,Ds.g,Ds.b,M,a)}return{getClearColor:function(){return o},setClearColor:function(y,M=1){o.set(y),l=M,f(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,f(o,l)},render:v,addToRenderList:p}}function lp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null);let r=s,a=!1;function o(_,E,O,H,X){let Z=!1;const G=d(H,O,E);r!==G&&(r=G,c(r.object)),Z=m(_,H,O,X),Z&&g(_,H,O,X),X!==null&&t.update(X,i.ELEMENT_ARRAY_BUFFER),(Z||a)&&(a=!1,b(_,E,O,H),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function l(){return i.createVertexArray()}function c(_){return i.bindVertexArray(_)}function h(_){return i.deleteVertexArray(_)}function d(_,E,O){const H=O.wireframe===!0;let X=n[_.id];X===void 0&&(X={},n[_.id]=X);let Z=X[E.id];Z===void 0&&(Z={},X[E.id]=Z);let G=Z[H];return G===void 0&&(G=u(l()),Z[H]=G),G}function u(_){const E=[],O=[],H=[];for(let X=0;X<e;X++)E[X]=0,O[X]=0,H[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:E,enabledAttributes:O,attributeDivisors:H,object:_,attributes:{},index:null}}function m(_,E,O,H){const X=r.attributes,Z=E.attributes;let G=0;const J=O.getAttributes();for(const W in J)if(J[W].location>=0){const ft=X[W];let yt=Z[W];if(yt===void 0&&(W==="instanceMatrix"&&_.instanceMatrix&&(yt=_.instanceMatrix),W==="instanceColor"&&_.instanceColor&&(yt=_.instanceColor)),ft===void 0||ft.attribute!==yt||yt&&ft.data!==yt.data)return!0;G++}return r.attributesNum!==G||r.index!==H}function g(_,E,O,H){const X={},Z=E.attributes;let G=0;const J=O.getAttributes();for(const W in J)if(J[W].location>=0){let ft=Z[W];ft===void 0&&(W==="instanceMatrix"&&_.instanceMatrix&&(ft=_.instanceMatrix),W==="instanceColor"&&_.instanceColor&&(ft=_.instanceColor));const yt={};yt.attribute=ft,ft&&ft.data&&(yt.data=ft.data),X[W]=yt,G++}r.attributes=X,r.attributesNum=G,r.index=H}function v(){const _=r.newAttributes;for(let E=0,O=_.length;E<O;E++)_[E]=0}function p(_){f(_,0)}function f(_,E){const O=r.newAttributes,H=r.enabledAttributes,X=r.attributeDivisors;O[_]=1,H[_]===0&&(i.enableVertexAttribArray(_),H[_]=1),X[_]!==E&&(i.vertexAttribDivisor(_,E),X[_]=E)}function y(){const _=r.newAttributes,E=r.enabledAttributes;for(let O=0,H=E.length;O<H;O++)E[O]!==_[O]&&(i.disableVertexAttribArray(O),E[O]=0)}function M(_,E,O,H,X,Z,G){G===!0?i.vertexAttribIPointer(_,E,O,X,Z):i.vertexAttribPointer(_,E,O,H,X,Z)}function b(_,E,O,H){v();const X=H.attributes,Z=O.getAttributes(),G=E.defaultAttributeValues;for(const J in Z){const W=Z[J];if(W.location>=0){let ut=X[J];if(ut===void 0&&(J==="instanceMatrix"&&_.instanceMatrix&&(ut=_.instanceMatrix),J==="instanceColor"&&_.instanceColor&&(ut=_.instanceColor)),ut!==void 0){const ft=ut.normalized,yt=ut.itemSize,Zt=t.get(ut);if(Zt===void 0)continue;const ee=Zt.buffer,Y=Zt.type,et=Zt.bytesPerElement,xt=Y===i.INT||Y===i.UNSIGNED_INT||ut.gpuType===ro;if(ut.isInterleavedBufferAttribute){const pt=ut.data,Ft=pt.stride,At=ut.offset;if(pt.isInstancedInterleavedBuffer){for(let Wt=0;Wt<W.locationSize;Wt++)f(W.location+Wt,pt.meshPerAttribute);_.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=pt.meshPerAttribute*pt.count)}else for(let Wt=0;Wt<W.locationSize;Wt++)p(W.location+Wt);i.bindBuffer(i.ARRAY_BUFFER,ee);for(let Wt=0;Wt<W.locationSize;Wt++)M(W.location+Wt,yt/W.locationSize,Y,ft,Ft*et,(At+yt/W.locationSize*Wt)*et,xt)}else{if(ut.isInstancedBufferAttribute){for(let pt=0;pt<W.locationSize;pt++)f(W.location+pt,ut.meshPerAttribute);_.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=ut.meshPerAttribute*ut.count)}else for(let pt=0;pt<W.locationSize;pt++)p(W.location+pt);i.bindBuffer(i.ARRAY_BUFFER,ee);for(let pt=0;pt<W.locationSize;pt++)M(W.location+pt,yt/W.locationSize,Y,ft,yt*et,yt/W.locationSize*pt*et,xt)}}else if(G!==void 0){const ft=G[J];if(ft!==void 0)switch(ft.length){case 2:i.vertexAttrib2fv(W.location,ft);break;case 3:i.vertexAttrib3fv(W.location,ft);break;case 4:i.vertexAttrib4fv(W.location,ft);break;default:i.vertexAttrib1fv(W.location,ft)}}}}y()}function R(){P();for(const _ in n){const E=n[_];for(const O in E){const H=E[O];for(const X in H)h(H[X].object),delete H[X];delete E[O]}delete n[_]}}function A(_){if(n[_.id]===void 0)return;const E=n[_.id];for(const O in E){const H=E[O];for(const X in H)h(H[X].object),delete H[X];delete E[O]}delete n[_.id]}function T(_){for(const E in n){const O=n[E];if(O[_.id]===void 0)continue;const H=O[_.id];for(const X in H)h(H[X].object),delete H[X];delete O[_.id]}}function P(){z(),a=!0,r!==s&&(r=s,c(r.object))}function z(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:P,resetDefaultState:z,dispose:R,releaseStatesOfGeometry:A,releaseStatesOfProgram:T,initAttributes:v,enableAttribute:p,disableUnusedAttributes:y}}function cp(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,d){d!==0&&(i.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let m=0;for(let g=0;g<d;g++)m+=h[g];e.update(m,n,1)}function l(c,h,d,u){if(d===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<c.length;g++)a(c[g],h[g],u[g]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let g=0;for(let v=0;v<d;v++)g+=h[v];for(let v=0;v<u.length;v++)e.update(g,n,u[v])}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function hp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(T){return!(T!==an&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){const P=T===Tn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==Cn&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==dn&&!P)}function l(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(u===!0){const T=t.get("EXT_clip_control");T.clipControlEXT(T.LOWER_LEFT_EXT,T.ZERO_TO_ONE_EXT)}const m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),y=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=g>0,A=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:b,vertexTextures:R,maxSamples:A}}function dp(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new kn,o=new Bt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const m=d.length!==0||u||n!==0||s;return s=u,n=d.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,m){const g=d.clippingPlanes,v=d.clipIntersection,p=d.clipShadows,f=i.get(d);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{const y=r?0:n,M=y*4;let b=f.clippingState||null;l.value=b,b=h(g,u,M,m);for(let R=0;R!==M;++R)b[R]=e[R];f.clippingState=b,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,m,g){const v=d!==null?d.length:0;let p=null;if(v!==0){if(p=l.value,g!==!0||p===null){const f=m+v*4,y=u.matrixWorldInverse;o.getNormalMatrix(y),(p===null||p.length<f)&&(p=new Float32Array(f));for(let M=0,b=m;M!==v;++M,b+=4)a.copy(d[M]).applyMatrix4(y,o),a.normal.toArray(p,b),p[b+3]=a.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,p}}function up(i){let t=new WeakMap;function e(a,o){return o===_a?a.mapping=Ii:o===va&&(a.mapping=Li),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===_a||o===va)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Sd(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class go extends Hc{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const wi=4,dl=[.125,.215,.35,.446,.526,.582],ei=20,Vr=new go,ul=new ot;let Wr=null,Xr=0,Yr=0,Kr=!1;const Qn=(1+Math.sqrt(5))/2,yi=1/Qn,fl=[new w(-Qn,yi,0),new w(Qn,yi,0),new w(-yi,0,Qn),new w(yi,0,Qn),new w(0,Qn,-yi),new w(0,Qn,yi),new w(-1,1,-1),new w(1,1,-1),new w(-1,1,1),new w(1,1,1)];class Ka{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Wr=this._renderer.getRenderTarget(),Xr=this._renderer.getActiveCubeFace(),Yr=this._renderer.getActiveMipmapLevel(),Kr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ml(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Wr,Xr,Yr),this._renderer.xr.enabled=Kr,t.scissorTest=!1,Us(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ii||t.mapping===Li?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Wr=this._renderer.getRenderTarget(),Xr=this._renderer.getActiveCubeFace(),Yr=this._renderer.getActiveMipmapLevel(),Kr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:sn,minFilter:sn,generateMipmaps:!1,type:Tn,format:an,colorSpace:Vn,depthBuffer:!1},s=pl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=fp(r)),this._blurMaterial=pp(r,t,e)}return s}_compileMaterial(t){const e=new Nt(this._lodPlanes[0],t);this._renderer.compile(e,Vr)}_sceneToCubeUV(t,e,n,s){const o=new Ye(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(ul),h.toneMapping=zn,h.autoClear=!1;const m=new dr({name:"PMREM.Background",side:Le,depthWrite:!1,depthTest:!1}),g=new Nt(new se,m);let v=!1;const p=t.background;p?p.isColor&&(m.color.copy(p),t.background=null,v=!0):(m.color.copy(ul),v=!0);for(let f=0;f<6;f++){const y=f%3;y===0?(o.up.set(0,l[f],0),o.lookAt(c[f],0,0)):y===1?(o.up.set(0,0,l[f]),o.lookAt(0,c[f],0)):(o.up.set(0,l[f],0),o.lookAt(0,0,c[f]));const M=this._cubeSize;Us(s,y*M,f>2?M:0,M,M),h.setRenderTarget(s),v&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ii||t.mapping===Li;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ml());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new Nt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;Us(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Vr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=fl[(s-r-1)%fl.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new Nt(this._lodPlanes[s],c),u=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*ei-1),v=r/g,p=isFinite(r)?1+Math.floor(h*v):ei;p>ei&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${ei}`);const f=[];let y=0;for(let T=0;T<ei;++T){const P=T/v,z=Math.exp(-P*P/2);f.push(z),T===0?y+=z:T<p&&(y+=2*z)}for(let T=0;T<f.length;T++)f[T]=f[T]/y;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=f,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:M}=this;u.dTheta.value=g,u.mipInt.value=M-n;const b=this._sizeLods[s],R=3*b*(s>M-wi?s-M+wi:0),A=4*(this._cubeSize-b);Us(e,R,A,3*b,2*b),l.setRenderTarget(e),l.render(d,Vr)}}function fp(i){const t=[],e=[],n=[];let s=i;const r=i-wi+1+dl.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let l=1/o;a>i-wi?l=dl[a-i+wi-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],m=6,g=6,v=3,p=2,f=1,y=new Float32Array(v*g*m),M=new Float32Array(p*g*m),b=new Float32Array(f*g*m);for(let A=0;A<m;A++){const T=A%3*2/3-1,P=A>2?0:-1,z=[T,P,0,T+2/3,P,0,T+2/3,P+1,0,T,P,0,T+2/3,P+1,0,T,P+1,0];y.set(z,v*g*A),M.set(u,p*g*A);const _=[A,A,A,A,A,A];b.set(_,f*g*A)}const R=new Se;R.setAttribute("position",new Be(y,v)),R.setAttribute("uv",new Be(M,p)),R.setAttribute("faceIndex",new Be(b,f)),t.push(R),s>wi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function pl(i,t,e){const n=new ln(i,t,e);return n.texture.mapping=cr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Us(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function pp(i,t,e){const n=new Float32Array(ei),s=new w(0,1,0);return new Re({name:"SphericalGaussianBlur",defines:{n:ei,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:_o(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function ml(){return new Re({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:_o(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function gl(){return new Re({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:_o(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:wn,depthTest:!1,depthWrite:!1})}function _o(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function mp(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===_a||l===va,h=l===Ii||l===Li;if(c||h){let d=t.get(o);const u=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==u)return e===null&&(e=new Ka(i)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const m=o.image;return c&&m&&m.height>0||h&&m&&s(m)?(e===null&&(e=new Ka(i)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",r),d.texture):null}}}return o}function s(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){const l=o.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function gp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&Js("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function _p(i,t,e,n){const s={},r=new WeakMap;function a(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const g in u.attributes)t.remove(u.attributes[g]);for(const g in u.morphAttributes){const v=u.morphAttributes[g];for(let p=0,f=v.length;p<f;p++)t.remove(v[p])}u.removeEventListener("dispose",a),delete s[u.id];const m=r.get(u);m&&(t.remove(m),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const g in u)t.update(u[g],i.ARRAY_BUFFER);const m=d.morphAttributes;for(const g in m){const v=m[g];for(let p=0,f=v.length;p<f;p++)t.update(v[p],i.ARRAY_BUFFER)}}function c(d){const u=[],m=d.index,g=d.attributes.position;let v=0;if(m!==null){const y=m.array;v=m.version;for(let M=0,b=y.length;M<b;M+=3){const R=y[M+0],A=y[M+1],T=y[M+2];u.push(R,A,A,T,T,R)}}else if(g!==void 0){const y=g.array;v=g.version;for(let M=0,b=y.length/3-1;M<b;M+=3){const R=M+0,A=M+1,T=M+2;u.push(R,A,A,T,T,R)}}else return;const p=new(Uc(u)?Bc:kc)(u,1);p.version=v;const f=r.get(d);f&&t.remove(f),r.set(d,p)}function h(d){const u=r.get(d);if(u){const m=d.index;m!==null&&u.version<m.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function vp(i,t,e){let n;function s(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,m){i.drawElements(n,m,r,u*a),e.update(m,n,1)}function c(u,m,g){g!==0&&(i.drawElementsInstanced(n,m,r,u*a,g),e.update(m,n,g))}function h(u,m,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,u,0,g);let p=0;for(let f=0;f<g;f++)p+=m[f];e.update(p,n,1)}function d(u,m,g,v){if(g===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<u.length;f++)c(u[f]/a,m[f],v[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,u,0,v,0,g);let f=0;for(let y=0;y<g;y++)f+=m[y];for(let y=0;y<v.length;y++)e.update(f,n,v[y])}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function xp(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Mp(i,t,e){const n=new WeakMap,s=new ae;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let _=function(){P.dispose(),n.delete(o),o.removeEventListener("dispose",_)};var m=_;u!==void 0&&u.texture.dispose();const g=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,p=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],y=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let b=0;g===!0&&(b=1),v===!0&&(b=2),p===!0&&(b=3);let R=o.attributes.position.count*b,A=1;R>t.maxTextureSize&&(A=Math.ceil(R/t.maxTextureSize),R=t.maxTextureSize);const T=new Float32Array(R*A*4*d),P=new Fc(T,R,A,d);P.type=dn,P.needsUpdate=!0;const z=b*4;for(let E=0;E<d;E++){const O=f[E],H=y[E],X=M[E],Z=R*A*4*E;for(let G=0;G<O.count;G++){const J=G*z;g===!0&&(s.fromBufferAttribute(O,G),T[Z+J+0]=s.x,T[Z+J+1]=s.y,T[Z+J+2]=s.z,T[Z+J+3]=0),v===!0&&(s.fromBufferAttribute(H,G),T[Z+J+4]=s.x,T[Z+J+5]=s.y,T[Z+J+6]=s.z,T[Z+J+7]=0),p===!0&&(s.fromBufferAttribute(X,G),T[Z+J+8]=s.x,T[Z+J+9]=s.y,T[Z+J+10]=s.z,T[Z+J+11]=X.itemSize===4?s.w:1)}}u={count:d,texture:P,size:new tt(R,A)},n.set(o,u),o.addEventListener("dispose",_)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let g=0;for(let p=0;p<c.length;p++)g+=c[p];const v=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(i,"morphTargetBaseInfluence",v),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function yp(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;s.get(u)!==c&&(u.update(),s.set(u,c))}return d}function a(){s=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}class Wc extends Pe{constructor(t,e,n,s,r,a,o,l,c,h=Ci){if(h!==Ci&&h!==Ni)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Ci&&(n=si),n===void 0&&h===Ni&&(n=Ui),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:ke,this.minFilter=l!==void 0?l:ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Xc=new Pe,_l=new Wc(1,1),Yc=new Fc,Kc=new od,$c=new Gc,vl=[],xl=[],Ml=new Float32Array(16),yl=new Float32Array(9),Sl=new Float32Array(4);function zi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=vl[s];if(r===void 0&&(r=new Float32Array(s),vl[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function be(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ur(i,t){let e=xl[t];e===void 0&&(e=new Int32Array(t),xl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Sp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Ep(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),be(e,t)}}function bp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),be(e,t)}}function wp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),be(e,t)}}function Tp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;Sl.set(n),i.uniformMatrix2fv(this.addr,!1,Sl),be(e,n)}}function Ap(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;yl.set(n),i.uniformMatrix3fv(this.addr,!1,yl),be(e,n)}}function Cp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),be(e,t)}else{if(Ee(e,n))return;Ml.set(n),i.uniformMatrix4fv(this.addr,!1,Ml),be(e,n)}}function Rp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Pp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),be(e,t)}}function Ip(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),be(e,t)}}function Lp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),be(e,t)}}function Dp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Up(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),be(e,t)}}function Np(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),be(e,t)}}function Fp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),be(e,t)}}function Op(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(_l.compareFunction=Dc,r=_l):r=Xc,e.setTexture2D(t||r,s)}function kp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Kc,s)}function Bp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||$c,s)}function zp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Yc,s)}function Hp(i){switch(i){case 5126:return Sp;case 35664:return Ep;case 35665:return bp;case 35666:return wp;case 35674:return Tp;case 35675:return Ap;case 35676:return Cp;case 5124:case 35670:return Rp;case 35667:case 35671:return Pp;case 35668:case 35672:return Ip;case 35669:case 35673:return Lp;case 5125:return Dp;case 36294:return Up;case 36295:return Np;case 36296:return Fp;case 35678:case 36198:case 36298:case 36306:case 35682:return Op;case 35679:case 36299:case 36307:return kp;case 35680:case 36300:case 36308:case 36293:return Bp;case 36289:case 36303:case 36311:case 36292:return zp}}function Gp(i,t){i.uniform1fv(this.addr,t)}function Vp(i,t){const e=zi(t,this.size,2);i.uniform2fv(this.addr,e)}function Wp(i,t){const e=zi(t,this.size,3);i.uniform3fv(this.addr,e)}function Xp(i,t){const e=zi(t,this.size,4);i.uniform4fv(this.addr,e)}function Yp(i,t){const e=zi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Kp(i,t){const e=zi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function $p(i,t){const e=zi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function qp(i,t){i.uniform1iv(this.addr,t)}function Zp(i,t){i.uniform2iv(this.addr,t)}function jp(i,t){i.uniform3iv(this.addr,t)}function Jp(i,t){i.uniform4iv(this.addr,t)}function Qp(i,t){i.uniform1uiv(this.addr,t)}function tm(i,t){i.uniform2uiv(this.addr,t)}function em(i,t){i.uniform3uiv(this.addr,t)}function nm(i,t){i.uniform4uiv(this.addr,t)}function im(i,t,e){const n=this.cache,s=t.length,r=ur(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||Xc,r[a])}function sm(i,t,e){const n=this.cache,s=t.length,r=ur(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Kc,r[a])}function rm(i,t,e){const n=this.cache,s=t.length,r=ur(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||$c,r[a])}function am(i,t,e){const n=this.cache,s=t.length,r=ur(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),be(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Yc,r[a])}function om(i){switch(i){case 5126:return Gp;case 35664:return Vp;case 35665:return Wp;case 35666:return Xp;case 35674:return Yp;case 35675:return Kp;case 35676:return $p;case 5124:case 35670:return qp;case 35667:case 35671:return Zp;case 35668:case 35672:return jp;case 35669:case 35673:return Jp;case 5125:return Qp;case 36294:return tm;case 36295:return em;case 36296:return nm;case 35678:case 36198:case 36298:case 36306:case 35682:return im;case 35679:case 36299:case 36307:return sm;case 35680:case 36300:case 36308:case 36293:return rm;case 36289:case 36303:case 36311:case 36292:return am}}class lm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Hp(e.type)}}class cm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=om(e.type)}}class hm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const $r=/(\w+)(\])?(\[|\.)?/g;function El(i,t){i.seq.push(t),i.map[t.id]=t}function dm(i,t,e){const n=i.name,s=n.length;for($r.lastIndex=0;;){const r=$r.exec(n),a=$r.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){El(e,c===void 0?new lm(o,i,t):new cm(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new hm(o),El(e,d)),e=d}}}class Qs{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);dm(r,a,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function bl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const um=37297;let fm=0;function pm(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function mm(i){const t=Jt.getPrimaries(Jt.workingColorSpace),e=Jt.getPrimaries(i);let n;switch(t===e?n="":t===ir&&e===nr?n="LinearDisplayP3ToLinearSRGB":t===nr&&e===ir&&(n="LinearSRGBToLinearDisplayP3"),i){case Vn:case hr:return[n,"LinearTransferOETF"];case en:case fo:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function wl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+pm(i.getShaderSource(t),a)}else return s}function gm(i,t){const e=mm(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function _m(i,t){let e;switch(t){case _c:e="Linear";break;case vc:e="Reinhard";break;case xc:e="Cineon";break;case so:e="ACESFilmic";break;case Mc:e="AgX";break;case yc:e="Neutral";break;case kh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Ns=new w;function vm(){Jt.getLuminanceCoefficients(Ns);const i=Ns.x.toFixed(4),t=Ns.y.toFixed(4),e=Ns.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function xm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(es).join(`
`)}function Mm(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function ym(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function es(i){return i!==""}function Tl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Al(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Sm=/^[ \t]*#include +<([\w\d./]+)>/gm;function $a(i){return i.replace(Sm,bm)}const Em=new Map;function bm(i,t){let e=kt[t];if(e===void 0){const n=Em.get(t);if(n!==void 0)e=kt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return $a(e)}const wm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Cl(i){return i.replace(wm,Tm)}function Tm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Rl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Am(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===pc?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===mc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===En&&(t="SHADOWMAP_TYPE_VSM"),t}function Cm(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ii:case Li:t="ENVMAP_TYPE_CUBE";break;case cr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Rm(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Li:t="ENVMAP_MODE_REFRACTION";break}return t}function Pm(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case gc:t="ENVMAP_BLENDING_MULTIPLY";break;case Fh:t="ENVMAP_BLENDING_MIX";break;case Oh:t="ENVMAP_BLENDING_ADD";break}return t}function Im(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function Lm(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=Am(e),c=Cm(e),h=Rm(e),d=Pm(e),u=Im(e),m=xm(e),g=Mm(r),v=s.createProgram();let p,f,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(es).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(es).join(`
`),f.length>0&&(f+=`
`)):(p=[Rl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(es).join(`
`),f=[Rl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?kt.tonemapping_pars_fragment:"",e.toneMapping!==zn?_m("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",kt.colorspace_pars_fragment,gm("linearToOutputTexel",e.outputColorSpace),vm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(es).join(`
`)),a=$a(a),a=Tl(a,e),a=Al(a,e),o=$a(o),o=Tl(o,e),o=Al(o,e),a=Cl(a),o=Cl(o),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",e.glslVersion===Ko?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ko?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const M=y+p+a,b=y+f+o,R=bl(s,s.VERTEX_SHADER,M),A=bl(s,s.FRAGMENT_SHADER,b);s.attachShader(v,R),s.attachShader(v,A),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function T(E){if(i.debug.checkShaderErrors){const O=s.getProgramInfoLog(v).trim(),H=s.getShaderInfoLog(R).trim(),X=s.getShaderInfoLog(A).trim();let Z=!0,G=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,R,A);else{const J=wl(s,R,"vertex"),W=wl(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+E.name+`
Material Type: `+E.type+`

Program Info Log: `+O+`
`+J+`
`+W)}else O!==""?console.warn("THREE.WebGLProgram: Program Info Log:",O):(H===""||X==="")&&(G=!1);G&&(E.diagnostics={runnable:Z,programLog:O,vertexShader:{log:H,prefix:p},fragmentShader:{log:X,prefix:f}})}s.deleteShader(R),s.deleteShader(A),P=new Qs(s,v),z=ym(s,v)}let P;this.getUniforms=function(){return P===void 0&&T(this),P};let z;this.getAttributes=function(){return z===void 0&&T(this),z};let _=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=s.getProgramParameter(v,um)),_},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=fm++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=R,this.fragmentShader=A,this}let Dm=0;class Um{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Nm(t),e.set(t,n)),n}}class Nm{constructor(t){this.id=Dm++,this.code=t,this.usedTimes=0}}function Fm(i,t,e,n,s,r,a){const o=new po,l=new Um,c=new Set,h=[],d=s.logarithmicDepthBuffer,u=s.reverseDepthBuffer,m=s.vertexTextures;let g=s.precision;const v={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(_){return c.add(_),_===0?"uv":`uv${_}`}function f(_,E,O,H,X){const Z=H.fog,G=X.geometry,J=_.isMeshStandardMaterial?H.environment:null,W=(_.isMeshStandardMaterial?e:t).get(_.envMap||J),ut=W&&W.mapping===cr?W.image.height:null,ft=v[_.type];_.precision!==null&&(g=s.getMaxPrecision(_.precision),g!==_.precision&&console.warn("THREE.WebGLProgram.getParameters:",_.precision,"not supported, using",g,"instead."));const yt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Zt=yt!==void 0?yt.length:0;let ee=0;G.morphAttributes.position!==void 0&&(ee=1),G.morphAttributes.normal!==void 0&&(ee=2),G.morphAttributes.color!==void 0&&(ee=3);let Y,et,xt,pt;if(ft){const Ne=hn[ft];Y=Ne.vertexShader,et=Ne.fragmentShader}else Y=_.vertexShader,et=_.fragmentShader,l.update(_),xt=l.getVertexShaderID(_),pt=l.getFragmentShaderID(_);const Ft=i.getRenderTarget(),At=X.isInstancedMesh===!0,Wt=X.isBatchedMesh===!0,ie=!!_.map,Xt=!!_.matcap,I=!!W,ze=!!_.aoMap,zt=!!_.lightMap,Kt=!!_.bumpMap,Rt=!!_.normalMap,he=!!_.displacementMap,Dt=!!_.emissiveMap,C=!!_.metalnessMap,x=!!_.roughnessMap,F=_.anisotropy>0,$=_.clearcoat>0,Q=_.dispersion>0,K=_.iridescence>0,St=_.sheen>0,at=_.transmission>0,mt=F&&!!_.anisotropyMap,$t=$&&!!_.clearcoatMap,nt=$&&!!_.clearcoatNormalMap,gt=$&&!!_.clearcoatRoughnessMap,Pt=K&&!!_.iridescenceMap,It=K&&!!_.iridescenceThicknessMap,_t=St&&!!_.sheenColorMap,Ht=St&&!!_.sheenRoughnessMap,Ot=!!_.specularMap,le=!!_.specularColorMap,L=!!_.specularIntensityMap,ht=at&&!!_.transmissionMap,V=at&&!!_.thicknessMap,q=!!_.gradientMap,lt=!!_.alphaMap,dt=_.alphaTest>0,Yt=!!_.alphaHash,_e=!!_.extensions;let Ue=zn;_.toneMapped&&(Ft===null||Ft.isXRRenderTarget===!0)&&(Ue=i.toneMapping);const jt={shaderID:ft,shaderType:_.type,shaderName:_.name,vertexShader:Y,fragmentShader:et,defines:_.defines,customVertexShaderID:xt,customFragmentShaderID:pt,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:g,batching:Wt,batchingColor:Wt&&X._colorsTexture!==null,instancing:At,instancingColor:At&&X.instanceColor!==null,instancingMorph:At&&X.morphTexture!==null,supportsVertexTextures:m,outputColorSpace:Ft===null?i.outputColorSpace:Ft.isXRRenderTarget===!0?Ft.texture.colorSpace:Vn,alphaToCoverage:!!_.alphaToCoverage,map:ie,matcap:Xt,envMap:I,envMapMode:I&&W.mapping,envMapCubeUVHeight:ut,aoMap:ze,lightMap:zt,bumpMap:Kt,normalMap:Rt,displacementMap:m&&he,emissiveMap:Dt,normalMapObjectSpace:Rt&&_.normalMapType===Gh,normalMapTangentSpace:Rt&&_.normalMapType===Lc,metalnessMap:C,roughnessMap:x,anisotropy:F,anisotropyMap:mt,clearcoat:$,clearcoatMap:$t,clearcoatNormalMap:nt,clearcoatRoughnessMap:gt,dispersion:Q,iridescence:K,iridescenceMap:Pt,iridescenceThicknessMap:It,sheen:St,sheenColorMap:_t,sheenRoughnessMap:Ht,specularMap:Ot,specularColorMap:le,specularIntensityMap:L,transmission:at,transmissionMap:ht,thicknessMap:V,gradientMap:q,opaque:_.transparent===!1&&_.blending===Ai&&_.alphaToCoverage===!1,alphaMap:lt,alphaTest:dt,alphaHash:Yt,combine:_.combine,mapUv:ie&&p(_.map.channel),aoMapUv:ze&&p(_.aoMap.channel),lightMapUv:zt&&p(_.lightMap.channel),bumpMapUv:Kt&&p(_.bumpMap.channel),normalMapUv:Rt&&p(_.normalMap.channel),displacementMapUv:he&&p(_.displacementMap.channel),emissiveMapUv:Dt&&p(_.emissiveMap.channel),metalnessMapUv:C&&p(_.metalnessMap.channel),roughnessMapUv:x&&p(_.roughnessMap.channel),anisotropyMapUv:mt&&p(_.anisotropyMap.channel),clearcoatMapUv:$t&&p(_.clearcoatMap.channel),clearcoatNormalMapUv:nt&&p(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:gt&&p(_.clearcoatRoughnessMap.channel),iridescenceMapUv:Pt&&p(_.iridescenceMap.channel),iridescenceThicknessMapUv:It&&p(_.iridescenceThicknessMap.channel),sheenColorMapUv:_t&&p(_.sheenColorMap.channel),sheenRoughnessMapUv:Ht&&p(_.sheenRoughnessMap.channel),specularMapUv:Ot&&p(_.specularMap.channel),specularColorMapUv:le&&p(_.specularColorMap.channel),specularIntensityMapUv:L&&p(_.specularIntensityMap.channel),transmissionMapUv:ht&&p(_.transmissionMap.channel),thicknessMapUv:V&&p(_.thicknessMap.channel),alphaMapUv:lt&&p(_.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(Rt||F),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!G.attributes.uv&&(ie||lt),fog:!!Z,useFog:_.fog===!0,fogExp2:!!Z&&Z.isFogExp2,flatShading:_.flatShading===!0,sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:u,skinning:X.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:Zt,morphTextureStride:ee,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&O.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ue,decodeVideoTexture:ie&&_.map.isVideoTexture===!0&&Jt.getTransfer(_.map.colorSpace)===ce,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===nn,flipSided:_.side===Le,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:_e&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_e&&_.extensions.multiDraw===!0||Wt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return jt.vertexUv1s=c.has(1),jt.vertexUv2s=c.has(2),jt.vertexUv3s=c.has(3),c.clear(),jt}function y(_){const E=[];if(_.shaderID?E.push(_.shaderID):(E.push(_.customVertexShaderID),E.push(_.customFragmentShaderID)),_.defines!==void 0)for(const O in _.defines)E.push(O),E.push(_.defines[O]);return _.isRawShaderMaterial===!1&&(M(E,_),b(E,_),E.push(i.outputColorSpace)),E.push(_.customProgramCacheKey),E.join()}function M(_,E){_.push(E.precision),_.push(E.outputColorSpace),_.push(E.envMapMode),_.push(E.envMapCubeUVHeight),_.push(E.mapUv),_.push(E.alphaMapUv),_.push(E.lightMapUv),_.push(E.aoMapUv),_.push(E.bumpMapUv),_.push(E.normalMapUv),_.push(E.displacementMapUv),_.push(E.emissiveMapUv),_.push(E.metalnessMapUv),_.push(E.roughnessMapUv),_.push(E.anisotropyMapUv),_.push(E.clearcoatMapUv),_.push(E.clearcoatNormalMapUv),_.push(E.clearcoatRoughnessMapUv),_.push(E.iridescenceMapUv),_.push(E.iridescenceThicknessMapUv),_.push(E.sheenColorMapUv),_.push(E.sheenRoughnessMapUv),_.push(E.specularMapUv),_.push(E.specularColorMapUv),_.push(E.specularIntensityMapUv),_.push(E.transmissionMapUv),_.push(E.thicknessMapUv),_.push(E.combine),_.push(E.fogExp2),_.push(E.sizeAttenuation),_.push(E.morphTargetsCount),_.push(E.morphAttributeCount),_.push(E.numDirLights),_.push(E.numPointLights),_.push(E.numSpotLights),_.push(E.numSpotLightMaps),_.push(E.numHemiLights),_.push(E.numRectAreaLights),_.push(E.numDirLightShadows),_.push(E.numPointLightShadows),_.push(E.numSpotLightShadows),_.push(E.numSpotLightShadowsWithMaps),_.push(E.numLightProbes),_.push(E.shadowMapType),_.push(E.toneMapping),_.push(E.numClippingPlanes),_.push(E.numClipIntersection),_.push(E.depthPacking)}function b(_,E){o.disableAll(),E.supportsVertexTextures&&o.enable(0),E.instancing&&o.enable(1),E.instancingColor&&o.enable(2),E.instancingMorph&&o.enable(3),E.matcap&&o.enable(4),E.envMap&&o.enable(5),E.normalMapObjectSpace&&o.enable(6),E.normalMapTangentSpace&&o.enable(7),E.clearcoat&&o.enable(8),E.iridescence&&o.enable(9),E.alphaTest&&o.enable(10),E.vertexColors&&o.enable(11),E.vertexAlphas&&o.enable(12),E.vertexUv1s&&o.enable(13),E.vertexUv2s&&o.enable(14),E.vertexUv3s&&o.enable(15),E.vertexTangents&&o.enable(16),E.anisotropy&&o.enable(17),E.alphaHash&&o.enable(18),E.batching&&o.enable(19),E.dispersion&&o.enable(20),E.batchingColor&&o.enable(21),_.push(o.mask),o.disableAll(),E.fog&&o.enable(0),E.useFog&&o.enable(1),E.flatShading&&o.enable(2),E.logarithmicDepthBuffer&&o.enable(3),E.reverseDepthBuffer&&o.enable(4),E.skinning&&o.enable(5),E.morphTargets&&o.enable(6),E.morphNormals&&o.enable(7),E.morphColors&&o.enable(8),E.premultipliedAlpha&&o.enable(9),E.shadowMapEnabled&&o.enable(10),E.doubleSided&&o.enable(11),E.flipSided&&o.enable(12),E.useDepthPacking&&o.enable(13),E.dithering&&o.enable(14),E.transmission&&o.enable(15),E.sheen&&o.enable(16),E.opaque&&o.enable(17),E.pointsUvs&&o.enable(18),E.decodeVideoTexture&&o.enable(19),E.alphaToCoverage&&o.enable(20),_.push(o.mask)}function R(_){const E=v[_.type];let O;if(E){const H=hn[E];O=os.clone(H.uniforms)}else O=_.uniforms;return O}function A(_,E){let O;for(let H=0,X=h.length;H<X;H++){const Z=h[H];if(Z.cacheKey===E){O=Z,++O.usedTimes;break}}return O===void 0&&(O=new Lm(i,E,_,r),h.push(O)),O}function T(_){if(--_.usedTimes===0){const E=h.indexOf(_);h[E]=h[h.length-1],h.pop(),_.destroy()}}function P(_){l.remove(_)}function z(){l.dispose()}return{getParameters:f,getProgramCacheKey:y,getUniforms:R,acquireProgram:A,releaseProgram:T,releaseShaderCache:P,programs:h,dispose:z}}function Om(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function km(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Pl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Il(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(d,u,m,g,v,p){let f=i[t];return f===void 0?(f={id:d.id,object:d,geometry:u,material:m,groupOrder:g,renderOrder:d.renderOrder,z:v,group:p},i[t]=f):(f.id=d.id,f.object=d,f.geometry=u,f.material=m,f.groupOrder=g,f.renderOrder=d.renderOrder,f.z=v,f.group=p),t++,f}function o(d,u,m,g,v,p){const f=a(d,u,m,g,v,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):e.push(f)}function l(d,u,m,g,v,p){const f=a(d,u,m,g,v,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):e.unshift(f)}function c(d,u){e.length>1&&e.sort(d||km),n.length>1&&n.sort(u||Pl),s.length>1&&s.sort(u||Pl)}function h(){for(let d=t,u=i.length;d<u;d++){const m=i[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function Bm(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new Il,i.set(n,[a])):s>=r.length?(a=new Il,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function zm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new w,color:new ot};break;case"SpotLight":e={position:new w,direction:new w,color:new ot,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new w,color:new ot,distance:0,decay:0};break;case"HemisphereLight":e={direction:new w,skyColor:new ot,groundColor:new ot};break;case"RectAreaLight":e={color:new ot,position:new w,halfWidth:new w,halfHeight:new w};break}return i[t.id]=e,e}}}function Hm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new tt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Gm=0;function Vm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Wm(i){const t=new zm,e=Hm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new w);const s=new w,r=new Vt,a=new Vt;function o(c){let h=0,d=0,u=0;for(let z=0;z<9;z++)n.probe[z].set(0,0,0);let m=0,g=0,v=0,p=0,f=0,y=0,M=0,b=0,R=0,A=0,T=0;c.sort(Vm);for(let z=0,_=c.length;z<_;z++){const E=c[z],O=E.color,H=E.intensity,X=E.distance,Z=E.shadow&&E.shadow.map?E.shadow.map.texture:null;if(E.isAmbientLight)h+=O.r*H,d+=O.g*H,u+=O.b*H;else if(E.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(E.sh.coefficients[G],H);T++}else if(E.isDirectionalLight){const G=t.get(E);if(G.color.copy(E.color).multiplyScalar(E.intensity),E.castShadow){const J=E.shadow,W=e.get(E);W.shadowIntensity=J.intensity,W.shadowBias=J.bias,W.shadowNormalBias=J.normalBias,W.shadowRadius=J.radius,W.shadowMapSize=J.mapSize,n.directionalShadow[m]=W,n.directionalShadowMap[m]=Z,n.directionalShadowMatrix[m]=E.shadow.matrix,y++}n.directional[m]=G,m++}else if(E.isSpotLight){const G=t.get(E);G.position.setFromMatrixPosition(E.matrixWorld),G.color.copy(O).multiplyScalar(H),G.distance=X,G.coneCos=Math.cos(E.angle),G.penumbraCos=Math.cos(E.angle*(1-E.penumbra)),G.decay=E.decay,n.spot[v]=G;const J=E.shadow;if(E.map&&(n.spotLightMap[R]=E.map,R++,J.updateMatrices(E),E.castShadow&&A++),n.spotLightMatrix[v]=J.matrix,E.castShadow){const W=e.get(E);W.shadowIntensity=J.intensity,W.shadowBias=J.bias,W.shadowNormalBias=J.normalBias,W.shadowRadius=J.radius,W.shadowMapSize=J.mapSize,n.spotShadow[v]=W,n.spotShadowMap[v]=Z,b++}v++}else if(E.isRectAreaLight){const G=t.get(E);G.color.copy(O).multiplyScalar(H),G.halfWidth.set(E.width*.5,0,0),G.halfHeight.set(0,E.height*.5,0),n.rectArea[p]=G,p++}else if(E.isPointLight){const G=t.get(E);if(G.color.copy(E.color).multiplyScalar(E.intensity),G.distance=E.distance,G.decay=E.decay,E.castShadow){const J=E.shadow,W=e.get(E);W.shadowIntensity=J.intensity,W.shadowBias=J.bias,W.shadowNormalBias=J.normalBias,W.shadowRadius=J.radius,W.shadowMapSize=J.mapSize,W.shadowCameraNear=J.camera.near,W.shadowCameraFar=J.camera.far,n.pointShadow[g]=W,n.pointShadowMap[g]=Z,n.pointShadowMatrix[g]=E.shadow.matrix,M++}n.point[g]=G,g++}else if(E.isHemisphereLight){const G=t.get(E);G.skyColor.copy(E.color).multiplyScalar(H),G.groundColor.copy(E.groundColor).multiplyScalar(H),n.hemi[f]=G,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=rt.LTC_FLOAT_1,n.rectAreaLTC2=rt.LTC_FLOAT_2):(n.rectAreaLTC1=rt.LTC_HALF_1,n.rectAreaLTC2=rt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const P=n.hash;(P.directionalLength!==m||P.pointLength!==g||P.spotLength!==v||P.rectAreaLength!==p||P.hemiLength!==f||P.numDirectionalShadows!==y||P.numPointShadows!==M||P.numSpotShadows!==b||P.numSpotMaps!==R||P.numLightProbes!==T)&&(n.directional.length=m,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=b,n.spotShadowMap.length=b,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=b+R-A,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=T,P.directionalLength=m,P.pointLength=g,P.spotLength=v,P.rectAreaLength=p,P.hemiLength=f,P.numDirectionalShadows=y,P.numPointShadows=M,P.numSpotShadows=b,P.numSpotMaps=R,P.numLightProbes=T,n.version=Gm++)}function l(c,h){let d=0,u=0,m=0,g=0,v=0;const p=h.matrixWorldInverse;for(let f=0,y=c.length;f<y;f++){const M=c[f];if(M.isDirectionalLight){const b=n.directional[d];b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),d++}else if(M.isSpotLight){const b=n.spot[m];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),m++}else if(M.isRectAreaLight){const b=n.rectArea[g];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),b.halfWidth.set(M.width*.5,0,0),b.halfHeight.set(0,M.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),g++}else if(M.isPointLight){const b=n.point[u];b.position.setFromMatrixPosition(M.matrixWorld),b.position.applyMatrix4(p),u++}else if(M.isHemisphereLight){const b=n.hemi[v];b.direction.setFromMatrixPosition(M.matrixWorld),b.direction.transformDirection(p),v++}}}return{setup:o,setupView:l,state:n}}function Ll(i){const t=new Wm(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Xm(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new Ll(i),t.set(s,[o])):r>=a.length?(o=new Ll(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class Ym extends Wn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=zh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Km extends Wn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const $m=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,qm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Zm(i,t,e){let n=new mo;const s=new tt,r=new tt,a=new ae,o=new Ym({depthPacking:Hh}),l=new Km,c={},h=e.maxTextureSize,d={[Hn]:Le,[Le]:Hn,[nn]:nn},u=new Re({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new tt},radius:{value:4}},vertexShader:$m,fragmentShader:qm}),m=u.clone();m.defines.HORIZONTAL_PASS=1;const g=new Se;g.setAttribute("position",new Be(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Nt(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=pc;let f=this.type;this.render=function(A,T,P){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||A.length===0)return;const z=i.getRenderTarget(),_=i.getActiveCubeFace(),E=i.getActiveMipmapLevel(),O=i.state;O.setBlending(wn),O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const H=f!==En&&this.type===En,X=f===En&&this.type!==En;for(let Z=0,G=A.length;Z<G;Z++){const J=A[Z],W=J.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);const ut=W.getFrameExtents();if(s.multiply(ut),r.copy(W.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ut.x),s.x=r.x*ut.x,W.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ut.y),s.y=r.y*ut.y,W.mapSize.y=r.y)),W.map===null||H===!0||X===!0){const yt=this.type!==En?{minFilter:ke,magFilter:ke}:{};W.map!==null&&W.map.dispose(),W.map=new ln(s.x,s.y,yt),W.map.texture.name=J.name+".shadowMap",W.camera.updateProjectionMatrix()}i.setRenderTarget(W.map),i.clear();const ft=W.getViewportCount();for(let yt=0;yt<ft;yt++){const Zt=W.getViewport(yt);a.set(r.x*Zt.x,r.y*Zt.y,r.x*Zt.z,r.y*Zt.w),O.viewport(a),W.updateMatrices(J,yt),n=W.getFrustum(),b(T,P,W.camera,J,this.type)}W.isPointLightShadow!==!0&&this.type===En&&y(W,P),W.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(z,_,E)};function y(A,T){const P=t.update(v);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,m.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new ln(s.x,s.y)),u.uniforms.shadow_pass.value=A.map.texture,u.uniforms.resolution.value=A.mapSize,u.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(T,null,P,u,v,null),m.uniforms.shadow_pass.value=A.mapPass.texture,m.uniforms.resolution.value=A.mapSize,m.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(T,null,P,m,v,null)}function M(A,T,P,z){let _=null;const E=P.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(E!==void 0)_=E;else if(_=P.isPointLight===!0?l:o,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const O=_.uuid,H=T.uuid;let X=c[O];X===void 0&&(X={},c[O]=X);let Z=X[H];Z===void 0&&(Z=_.clone(),X[H]=Z,T.addEventListener("dispose",R)),_=Z}if(_.visible=T.visible,_.wireframe=T.wireframe,z===En?_.side=T.shadowSide!==null?T.shadowSide:T.side:_.side=T.shadowSide!==null?T.shadowSide:d[T.side],_.alphaMap=T.alphaMap,_.alphaTest=T.alphaTest,_.map=T.map,_.clipShadows=T.clipShadows,_.clippingPlanes=T.clippingPlanes,_.clipIntersection=T.clipIntersection,_.displacementMap=T.displacementMap,_.displacementScale=T.displacementScale,_.displacementBias=T.displacementBias,_.wireframeLinewidth=T.wireframeLinewidth,_.linewidth=T.linewidth,P.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const O=i.properties.get(_);O.light=P}return _}function b(A,T,P,z,_){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&_===En)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(P.matrixWorldInverse,A.matrixWorld);const H=t.update(A),X=A.material;if(Array.isArray(X)){const Z=H.groups;for(let G=0,J=Z.length;G<J;G++){const W=Z[G],ut=X[W.materialIndex];if(ut&&ut.visible){const ft=M(A,ut,z,_);A.onBeforeShadow(i,A,T,P,H,ft,W),i.renderBufferDirect(P,null,H,ft,A,W),A.onAfterShadow(i,A,T,P,H,ft,W)}}}else if(X.visible){const Z=M(A,X,z,_);A.onBeforeShadow(i,A,T,P,H,Z,null),i.renderBufferDirect(P,null,H,Z,A,null),A.onAfterShadow(i,A,T,P,H,Z,null)}}const O=A.children;for(let H=0,X=O.length;H<X;H++)b(O[H],T,P,z,_)}function R(A){A.target.removeEventListener("dispose",R);for(const P in c){const z=c[P],_=A.target.uuid;_ in z&&(z[_].dispose(),delete z[_])}}}const jm={[ha]:da,[ua]:ma,[fa]:ga,[Pi]:pa,[da]:ha,[ma]:ua,[ga]:fa,[pa]:Pi};function Jm(i){function t(){let L=!1;const ht=new ae;let V=null;const q=new ae(0,0,0,0);return{setMask:function(lt){V!==lt&&!L&&(i.colorMask(lt,lt,lt,lt),V=lt)},setLocked:function(lt){L=lt},setClear:function(lt,dt,Yt,_e,Ue){Ue===!0&&(lt*=_e,dt*=_e,Yt*=_e),ht.set(lt,dt,Yt,_e),q.equals(ht)===!1&&(i.clearColor(lt,dt,Yt,_e),q.copy(ht))},reset:function(){L=!1,V=null,q.set(-1,0,0,0)}}}function e(){let L=!1,ht=!1,V=null,q=null,lt=null;return{setReversed:function(dt){ht=dt},setTest:function(dt){dt?xt(i.DEPTH_TEST):pt(i.DEPTH_TEST)},setMask:function(dt){V!==dt&&!L&&(i.depthMask(dt),V=dt)},setFunc:function(dt){if(ht&&(dt=jm[dt]),q!==dt){switch(dt){case ha:i.depthFunc(i.NEVER);break;case da:i.depthFunc(i.ALWAYS);break;case ua:i.depthFunc(i.LESS);break;case Pi:i.depthFunc(i.LEQUAL);break;case fa:i.depthFunc(i.EQUAL);break;case pa:i.depthFunc(i.GEQUAL);break;case ma:i.depthFunc(i.GREATER);break;case ga:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}q=dt}},setLocked:function(dt){L=dt},setClear:function(dt){lt!==dt&&(i.clearDepth(dt),lt=dt)},reset:function(){L=!1,V=null,q=null,lt=null}}}function n(){let L=!1,ht=null,V=null,q=null,lt=null,dt=null,Yt=null,_e=null,Ue=null;return{setTest:function(jt){L||(jt?xt(i.STENCIL_TEST):pt(i.STENCIL_TEST))},setMask:function(jt){ht!==jt&&!L&&(i.stencilMask(jt),ht=jt)},setFunc:function(jt,Ne,_n){(V!==jt||q!==Ne||lt!==_n)&&(i.stencilFunc(jt,Ne,_n),V=jt,q=Ne,lt=_n)},setOp:function(jt,Ne,_n){(dt!==jt||Yt!==Ne||_e!==_n)&&(i.stencilOp(jt,Ne,_n),dt=jt,Yt=Ne,_e=_n)},setLocked:function(jt){L=jt},setClear:function(jt){Ue!==jt&&(i.clearStencil(jt),Ue=jt)},reset:function(){L=!1,ht=null,V=null,q=null,lt=null,dt=null,Yt=null,_e=null,Ue=null}}}const s=new t,r=new e,a=new n,o=new WeakMap,l=new WeakMap;let c={},h={},d=new WeakMap,u=[],m=null,g=!1,v=null,p=null,f=null,y=null,M=null,b=null,R=null,A=new ot(0,0,0),T=0,P=!1,z=null,_=null,E=null,O=null,H=null;const X=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Z=!1,G=0;const J=i.getParameter(i.VERSION);J.indexOf("WebGL")!==-1?(G=parseFloat(/^WebGL (\d)/.exec(J)[1]),Z=G>=1):J.indexOf("OpenGL ES")!==-1&&(G=parseFloat(/^OpenGL ES (\d)/.exec(J)[1]),Z=G>=2);let W=null,ut={};const ft=i.getParameter(i.SCISSOR_BOX),yt=i.getParameter(i.VIEWPORT),Zt=new ae().fromArray(ft),ee=new ae().fromArray(yt);function Y(L,ht,V,q){const lt=new Uint8Array(4),dt=i.createTexture();i.bindTexture(L,dt),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Yt=0;Yt<V;Yt++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(ht,0,i.RGBA,1,1,q,0,i.RGBA,i.UNSIGNED_BYTE,lt):i.texImage2D(ht+Yt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,lt);return dt}const et={};et[i.TEXTURE_2D]=Y(i.TEXTURE_2D,i.TEXTURE_2D,1),et[i.TEXTURE_CUBE_MAP]=Y(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),et[i.TEXTURE_2D_ARRAY]=Y(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),et[i.TEXTURE_3D]=Y(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),a.setClear(0),xt(i.DEPTH_TEST),r.setFunc(Pi),zt(!1),Kt(Go),xt(i.CULL_FACE),I(wn);function xt(L){c[L]!==!0&&(i.enable(L),c[L]=!0)}function pt(L){c[L]!==!1&&(i.disable(L),c[L]=!1)}function Ft(L,ht){return h[L]!==ht?(i.bindFramebuffer(L,ht),h[L]=ht,L===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=ht),L===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=ht),!0):!1}function At(L,ht){let V=u,q=!1;if(L){V=d.get(ht),V===void 0&&(V=[],d.set(ht,V));const lt=L.textures;if(V.length!==lt.length||V[0]!==i.COLOR_ATTACHMENT0){for(let dt=0,Yt=lt.length;dt<Yt;dt++)V[dt]=i.COLOR_ATTACHMENT0+dt;V.length=lt.length,q=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,q=!0);q&&i.drawBuffers(V)}function Wt(L){return m!==L?(i.useProgram(L),m=L,!0):!1}const ie={[ti]:i.FUNC_ADD,[xh]:i.FUNC_SUBTRACT,[Mh]:i.FUNC_REVERSE_SUBTRACT};ie[yh]=i.MIN,ie[Sh]=i.MAX;const Xt={[Eh]:i.ZERO,[bh]:i.ONE,[wh]:i.SRC_COLOR,[la]:i.SRC_ALPHA,[Ih]:i.SRC_ALPHA_SATURATE,[Rh]:i.DST_COLOR,[Ah]:i.DST_ALPHA,[Th]:i.ONE_MINUS_SRC_COLOR,[ca]:i.ONE_MINUS_SRC_ALPHA,[Ph]:i.ONE_MINUS_DST_COLOR,[Ch]:i.ONE_MINUS_DST_ALPHA,[Lh]:i.CONSTANT_COLOR,[Dh]:i.ONE_MINUS_CONSTANT_COLOR,[Uh]:i.CONSTANT_ALPHA,[Nh]:i.ONE_MINUS_CONSTANT_ALPHA};function I(L,ht,V,q,lt,dt,Yt,_e,Ue,jt){if(L===wn){g===!0&&(pt(i.BLEND),g=!1);return}if(g===!1&&(xt(i.BLEND),g=!0),L!==vh){if(L!==v||jt!==P){if((p!==ti||M!==ti)&&(i.blendEquation(i.FUNC_ADD),p=ti,M=ti),jt)switch(L){case Ai:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case oa:i.blendFunc(i.ONE,i.ONE);break;case Vo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Wo:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case Ai:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case oa:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Vo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Wo:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}f=null,y=null,b=null,R=null,A.set(0,0,0),T=0,v=L,P=jt}return}lt=lt||ht,dt=dt||V,Yt=Yt||q,(ht!==p||lt!==M)&&(i.blendEquationSeparate(ie[ht],ie[lt]),p=ht,M=lt),(V!==f||q!==y||dt!==b||Yt!==R)&&(i.blendFuncSeparate(Xt[V],Xt[q],Xt[dt],Xt[Yt]),f=V,y=q,b=dt,R=Yt),(_e.equals(A)===!1||Ue!==T)&&(i.blendColor(_e.r,_e.g,_e.b,Ue),A.copy(_e),T=Ue),v=L,P=!1}function ze(L,ht){L.side===nn?pt(i.CULL_FACE):xt(i.CULL_FACE);let V=L.side===Le;ht&&(V=!V),zt(V),L.blending===Ai&&L.transparent===!1?I(wn):I(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),r.setFunc(L.depthFunc),r.setTest(L.depthTest),r.setMask(L.depthWrite),s.setMask(L.colorWrite);const q=L.stencilWrite;a.setTest(q),q&&(a.setMask(L.stencilWriteMask),a.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),a.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),he(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?xt(i.SAMPLE_ALPHA_TO_COVERAGE):pt(i.SAMPLE_ALPHA_TO_COVERAGE)}function zt(L){z!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),z=L)}function Kt(L){L!==gh?(xt(i.CULL_FACE),L!==_&&(L===Go?i.cullFace(i.BACK):L===_h?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):pt(i.CULL_FACE),_=L}function Rt(L){L!==E&&(Z&&i.lineWidth(L),E=L)}function he(L,ht,V){L?(xt(i.POLYGON_OFFSET_FILL),(O!==ht||H!==V)&&(i.polygonOffset(ht,V),O=ht,H=V)):pt(i.POLYGON_OFFSET_FILL)}function Dt(L){L?xt(i.SCISSOR_TEST):pt(i.SCISSOR_TEST)}function C(L){L===void 0&&(L=i.TEXTURE0+X-1),W!==L&&(i.activeTexture(L),W=L)}function x(L,ht,V){V===void 0&&(W===null?V=i.TEXTURE0+X-1:V=W);let q=ut[V];q===void 0&&(q={type:void 0,texture:void 0},ut[V]=q),(q.type!==L||q.texture!==ht)&&(W!==V&&(i.activeTexture(V),W=V),i.bindTexture(L,ht||et[L]),q.type=L,q.texture=ht)}function F(){const L=ut[W];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function $(){try{i.compressedTexImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Q(){try{i.compressedTexImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function St(){try{i.texSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function at(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function mt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function $t(){try{i.texStorage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function nt(){try{i.texStorage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function gt(){try{i.texImage2D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Pt(){try{i.texImage3D.apply(i,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function It(L){Zt.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),Zt.copy(L))}function _t(L){ee.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),ee.copy(L))}function Ht(L,ht){let V=l.get(ht);V===void 0&&(V=new WeakMap,l.set(ht,V));let q=V.get(L);q===void 0&&(q=i.getUniformBlockIndex(ht,L.name),V.set(L,q))}function Ot(L,ht){const q=l.get(ht).get(L);o.get(ht)!==q&&(i.uniformBlockBinding(ht,q,L.__bindingPointIndex),o.set(ht,q))}function le(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},W=null,ut={},h={},d=new WeakMap,u=[],m=null,g=!1,v=null,p=null,f=null,y=null,M=null,b=null,R=null,A=new ot(0,0,0),T=0,P=!1,z=null,_=null,E=null,O=null,H=null,Zt.set(0,0,i.canvas.width,i.canvas.height),ee.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),a.reset()}return{buffers:{color:s,depth:r,stencil:a},enable:xt,disable:pt,bindFramebuffer:Ft,drawBuffers:At,useProgram:Wt,setBlending:I,setMaterial:ze,setFlipSided:zt,setCullFace:Kt,setLineWidth:Rt,setPolygonOffset:he,setScissorTest:Dt,activeTexture:C,bindTexture:x,unbindTexture:F,compressedTexImage2D:$,compressedTexImage3D:Q,texImage2D:gt,texImage3D:Pt,updateUBOMapping:Ht,uniformBlockBinding:Ot,texStorage2D:$t,texStorage3D:nt,texSubImage2D:K,texSubImage3D:St,compressedTexSubImage2D:at,compressedTexSubImage3D:mt,scissor:It,viewport:_t,reset:le}}function Dl(i,t,e,n){const s=Qm(n);switch(e){case Tc:return i*t;case Cc:return i*t;case Rc:return i*t*2;case lo:return i*t/s.components*s.byteLength;case co:return i*t/s.components*s.byteLength;case Pc:return i*t*2/s.components*s.byteLength;case ho:return i*t*2/s.components*s.byteLength;case Ac:return i*t*3/s.components*s.byteLength;case an:return i*t*4/s.components*s.byteLength;case uo:return i*t*4/s.components*s.byteLength;case Ks:case $s:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case qs:case Zs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ya:case Ea:return Math.max(i,16)*Math.max(t,8)/4;case Ma:case Sa:return Math.max(i,8)*Math.max(t,8)/2;case ba:case wa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ta:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Aa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ca:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ra:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Pa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ia:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case La:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Da:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ua:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Na:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Fa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Oa:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ka:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ba:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case za:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case js:case Ha:case Ga:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Ic:case Va:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Wa:case Xa:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Qm(i){switch(i){case Cn:case Ec:return{byteLength:1,components:1};case as:case bc:case Tn:return{byteLength:2,components:1};case ao:case oo:return{byteLength:2,components:4};case si:case ro:case dn:return{byteLength:4,components:1};case wc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function tg(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new tt,h=new WeakMap;let d;const u=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(C,x){return m?new OffscreenCanvas(C,x):rr("canvas")}function v(C,x,F){let $=1;const Q=Dt(C);if((Q.width>F||Q.height>F)&&($=F/Math.max(Q.width,Q.height)),$<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const K=Math.floor($*Q.width),St=Math.floor($*Q.height);d===void 0&&(d=g(K,St));const at=x?g(K,St):d;return at.width=K,at.height=St,at.getContext("2d").drawImage(C,0,0,K,St),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+K+"x"+St+")."),at}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),C;return C}function p(C){return C.generateMipmaps&&C.minFilter!==ke&&C.minFilter!==sn}function f(C){i.generateMipmap(C)}function y(C,x,F,$,Q=!1){if(C!==null){if(i[C]!==void 0)return i[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let K=x;if(x===i.RED&&(F===i.FLOAT&&(K=i.R32F),F===i.HALF_FLOAT&&(K=i.R16F),F===i.UNSIGNED_BYTE&&(K=i.R8)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(K=i.R8UI),F===i.UNSIGNED_SHORT&&(K=i.R16UI),F===i.UNSIGNED_INT&&(K=i.R32UI),F===i.BYTE&&(K=i.R8I),F===i.SHORT&&(K=i.R16I),F===i.INT&&(K=i.R32I)),x===i.RG&&(F===i.FLOAT&&(K=i.RG32F),F===i.HALF_FLOAT&&(K=i.RG16F),F===i.UNSIGNED_BYTE&&(K=i.RG8)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(K=i.RG8UI),F===i.UNSIGNED_SHORT&&(K=i.RG16UI),F===i.UNSIGNED_INT&&(K=i.RG32UI),F===i.BYTE&&(K=i.RG8I),F===i.SHORT&&(K=i.RG16I),F===i.INT&&(K=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(K=i.RGB8UI),F===i.UNSIGNED_SHORT&&(K=i.RGB16UI),F===i.UNSIGNED_INT&&(K=i.RGB32UI),F===i.BYTE&&(K=i.RGB8I),F===i.SHORT&&(K=i.RGB16I),F===i.INT&&(K=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),F===i.UNSIGNED_INT&&(K=i.RGBA32UI),F===i.BYTE&&(K=i.RGBA8I),F===i.SHORT&&(K=i.RGBA16I),F===i.INT&&(K=i.RGBA32I)),x===i.RGB&&F===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),x===i.RGBA){const St=Q?er:Jt.getTransfer($);F===i.FLOAT&&(K=i.RGBA32F),F===i.HALF_FLOAT&&(K=i.RGBA16F),F===i.UNSIGNED_BYTE&&(K=St===ce?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function M(C,x){let F;return C?x===null||x===si||x===Ui?F=i.DEPTH24_STENCIL8:x===dn?F=i.DEPTH32F_STENCIL8:x===as&&(F=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===si||x===Ui?F=i.DEPTH_COMPONENT24:x===dn?F=i.DEPTH_COMPONENT32F:x===as&&(F=i.DEPTH_COMPONENT16),F}function b(C,x){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==ke&&C.minFilter!==sn?Math.log2(Math.max(x.width,x.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?x.mipmaps.length:1}function R(C){const x=C.target;x.removeEventListener("dispose",R),T(x),x.isVideoTexture&&h.delete(x)}function A(C){const x=C.target;x.removeEventListener("dispose",A),z(x)}function T(C){const x=n.get(C);if(x.__webglInit===void 0)return;const F=C.source,$=u.get(F);if($){const Q=$[x.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&P(C),Object.keys($).length===0&&u.delete(F)}n.remove(C)}function P(C){const x=n.get(C);i.deleteTexture(x.__webglTexture);const F=C.source,$=u.get(F);delete $[x.__cacheKey],a.memory.textures--}function z(C){const x=n.get(C);if(C.depthTexture&&C.depthTexture.dispose(),C.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(x.__webglFramebuffer[$]))for(let Q=0;Q<x.__webglFramebuffer[$].length;Q++)i.deleteFramebuffer(x.__webglFramebuffer[$][Q]);else i.deleteFramebuffer(x.__webglFramebuffer[$]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[$])}else{if(Array.isArray(x.__webglFramebuffer))for(let $=0;$<x.__webglFramebuffer.length;$++)i.deleteFramebuffer(x.__webglFramebuffer[$]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let $=0;$<x.__webglColorRenderbuffer.length;$++)x.__webglColorRenderbuffer[$]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[$]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const F=C.textures;for(let $=0,Q=F.length;$<Q;$++){const K=n.get(F[$]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),a.memory.textures--),n.remove(F[$])}n.remove(C)}let _=0;function E(){_=0}function O(){const C=_;return C>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),_+=1,C}function H(C){const x=[];return x.push(C.wrapS),x.push(C.wrapT),x.push(C.wrapR||0),x.push(C.magFilter),x.push(C.minFilter),x.push(C.anisotropy),x.push(C.internalFormat),x.push(C.format),x.push(C.type),x.push(C.generateMipmaps),x.push(C.premultiplyAlpha),x.push(C.flipY),x.push(C.unpackAlignment),x.push(C.colorSpace),x.join()}function X(C,x){const F=n.get(C);if(C.isVideoTexture&&Rt(C),C.isRenderTargetTexture===!1&&C.version>0&&F.__version!==C.version){const $=C.image;if($===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{ee(F,C,x);return}}e.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function Z(C,x){const F=n.get(C);if(C.version>0&&F.__version!==C.version){ee(F,C,x);return}e.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function G(C,x){const F=n.get(C);if(C.version>0&&F.__version!==C.version){ee(F,C,x);return}e.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function J(C,x){const F=n.get(C);if(C.version>0&&F.__version!==C.version){Y(F,C,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}const W={[Di]:i.REPEAT,[ni]:i.CLAMP_TO_EDGE,[xa]:i.MIRRORED_REPEAT},ut={[ke]:i.NEAREST,[Bh]:i.NEAREST_MIPMAP_NEAREST,[ms]:i.NEAREST_MIPMAP_LINEAR,[sn]:i.LINEAR,[Mr]:i.LINEAR_MIPMAP_NEAREST,[ii]:i.LINEAR_MIPMAP_LINEAR},ft={[Vh]:i.NEVER,[qh]:i.ALWAYS,[Wh]:i.LESS,[Dc]:i.LEQUAL,[Xh]:i.EQUAL,[$h]:i.GEQUAL,[Yh]:i.GREATER,[Kh]:i.NOTEQUAL};function yt(C,x){if(x.type===dn&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===sn||x.magFilter===Mr||x.magFilter===ms||x.magFilter===ii||x.minFilter===sn||x.minFilter===Mr||x.minFilter===ms||x.minFilter===ii)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,W[x.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,W[x.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,W[x.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,ut[x.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,ut[x.minFilter]),x.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,ft[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===ke||x.minFilter!==ms&&x.minFilter!==ii||x.type===dn&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const F=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function Zt(C,x){let F=!1;C.__webglInit===void 0&&(C.__webglInit=!0,x.addEventListener("dispose",R));const $=x.source;let Q=u.get($);Q===void 0&&(Q={},u.set($,Q));const K=H(x);if(K!==C.__cacheKey){Q[K]===void 0&&(Q[K]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,F=!0),Q[K].usedTimes++;const St=Q[C.__cacheKey];St!==void 0&&(Q[C.__cacheKey].usedTimes--,St.usedTimes===0&&P(x)),C.__cacheKey=K,C.__webglTexture=Q[K].texture}return F}function ee(C,x,F){let $=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&($=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&($=i.TEXTURE_3D);const Q=Zt(C,x),K=x.source;e.bindTexture($,C.__webglTexture,i.TEXTURE0+F);const St=n.get(K);if(K.version!==St.__version||Q===!0){e.activeTexture(i.TEXTURE0+F);const at=Jt.getPrimaries(Jt.workingColorSpace),mt=x.colorSpace===Bn?null:Jt.getPrimaries(x.colorSpace),$t=x.colorSpace===Bn||at===mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,$t);let nt=v(x.image,!1,s.maxTextureSize);nt=he(x,nt);const gt=r.convert(x.format,x.colorSpace),Pt=r.convert(x.type);let It=y(x.internalFormat,gt,Pt,x.colorSpace,x.isVideoTexture);yt($,x);let _t;const Ht=x.mipmaps,Ot=x.isVideoTexture!==!0,le=St.__version===void 0||Q===!0,L=K.dataReady,ht=b(x,nt);if(x.isDepthTexture)It=M(x.format===Ni,x.type),le&&(Ot?e.texStorage2D(i.TEXTURE_2D,1,It,nt.width,nt.height):e.texImage2D(i.TEXTURE_2D,0,It,nt.width,nt.height,0,gt,Pt,null));else if(x.isDataTexture)if(Ht.length>0){Ot&&le&&e.texStorage2D(i.TEXTURE_2D,ht,It,Ht[0].width,Ht[0].height);for(let V=0,q=Ht.length;V<q;V++)_t=Ht[V],Ot?L&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,_t.width,_t.height,gt,Pt,_t.data):e.texImage2D(i.TEXTURE_2D,V,It,_t.width,_t.height,0,gt,Pt,_t.data);x.generateMipmaps=!1}else Ot?(le&&e.texStorage2D(i.TEXTURE_2D,ht,It,nt.width,nt.height),L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,nt.width,nt.height,gt,Pt,nt.data)):e.texImage2D(i.TEXTURE_2D,0,It,nt.width,nt.height,0,gt,Pt,nt.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ot&&le&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ht,It,Ht[0].width,Ht[0].height,nt.depth);for(let V=0,q=Ht.length;V<q;V++)if(_t=Ht[V],x.format!==an)if(gt!==null)if(Ot){if(L)if(x.layerUpdates.size>0){const lt=Dl(_t.width,_t.height,x.format,x.type);for(const dt of x.layerUpdates){const Yt=_t.data.subarray(dt*lt/_t.data.BYTES_PER_ELEMENT,(dt+1)*lt/_t.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,dt,_t.width,_t.height,1,gt,Yt,0,0)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,_t.width,_t.height,nt.depth,gt,_t.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,V,It,_t.width,_t.height,nt.depth,0,_t.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ot?L&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,_t.width,_t.height,nt.depth,gt,Pt,_t.data):e.texImage3D(i.TEXTURE_2D_ARRAY,V,It,_t.width,_t.height,nt.depth,0,gt,Pt,_t.data)}else{Ot&&le&&e.texStorage2D(i.TEXTURE_2D,ht,It,Ht[0].width,Ht[0].height);for(let V=0,q=Ht.length;V<q;V++)_t=Ht[V],x.format!==an?gt!==null?Ot?L&&e.compressedTexSubImage2D(i.TEXTURE_2D,V,0,0,_t.width,_t.height,gt,_t.data):e.compressedTexImage2D(i.TEXTURE_2D,V,It,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ot?L&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,_t.width,_t.height,gt,Pt,_t.data):e.texImage2D(i.TEXTURE_2D,V,It,_t.width,_t.height,0,gt,Pt,_t.data)}else if(x.isDataArrayTexture)if(Ot){if(le&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ht,It,nt.width,nt.height,nt.depth),L)if(x.layerUpdates.size>0){const V=Dl(nt.width,nt.height,x.format,x.type);for(const q of x.layerUpdates){const lt=nt.data.subarray(q*V/nt.data.BYTES_PER_ELEMENT,(q+1)*V/nt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,q,nt.width,nt.height,1,gt,Pt,lt)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,nt.width,nt.height,nt.depth,gt,Pt,nt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,It,nt.width,nt.height,nt.depth,0,gt,Pt,nt.data);else if(x.isData3DTexture)Ot?(le&&e.texStorage3D(i.TEXTURE_3D,ht,It,nt.width,nt.height,nt.depth),L&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,nt.width,nt.height,nt.depth,gt,Pt,nt.data)):e.texImage3D(i.TEXTURE_3D,0,It,nt.width,nt.height,nt.depth,0,gt,Pt,nt.data);else if(x.isFramebufferTexture){if(le)if(Ot)e.texStorage2D(i.TEXTURE_2D,ht,It,nt.width,nt.height);else{let V=nt.width,q=nt.height;for(let lt=0;lt<ht;lt++)e.texImage2D(i.TEXTURE_2D,lt,It,V,q,0,gt,Pt,null),V>>=1,q>>=1}}else if(Ht.length>0){if(Ot&&le){const V=Dt(Ht[0]);e.texStorage2D(i.TEXTURE_2D,ht,It,V.width,V.height)}for(let V=0,q=Ht.length;V<q;V++)_t=Ht[V],Ot?L&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,gt,Pt,_t):e.texImage2D(i.TEXTURE_2D,V,It,gt,Pt,_t);x.generateMipmaps=!1}else if(Ot){if(le){const V=Dt(nt);e.texStorage2D(i.TEXTURE_2D,ht,It,V.width,V.height)}L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,gt,Pt,nt)}else e.texImage2D(i.TEXTURE_2D,0,It,gt,Pt,nt);p(x)&&f($),St.__version=K.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function Y(C,x,F){if(x.image.length!==6)return;const $=Zt(C,x),Q=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+F);const K=n.get(Q);if(Q.version!==K.__version||$===!0){e.activeTexture(i.TEXTURE0+F);const St=Jt.getPrimaries(Jt.workingColorSpace),at=x.colorSpace===Bn?null:Jt.getPrimaries(x.colorSpace),mt=x.colorSpace===Bn||St===at?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);const $t=x.isCompressedTexture||x.image[0].isCompressedTexture,nt=x.image[0]&&x.image[0].isDataTexture,gt=[];for(let q=0;q<6;q++)!$t&&!nt?gt[q]=v(x.image[q],!0,s.maxCubemapSize):gt[q]=nt?x.image[q].image:x.image[q],gt[q]=he(x,gt[q]);const Pt=gt[0],It=r.convert(x.format,x.colorSpace),_t=r.convert(x.type),Ht=y(x.internalFormat,It,_t,x.colorSpace),Ot=x.isVideoTexture!==!0,le=K.__version===void 0||$===!0,L=Q.dataReady;let ht=b(x,Pt);yt(i.TEXTURE_CUBE_MAP,x);let V;if($t){Ot&&le&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ht,Ht,Pt.width,Pt.height);for(let q=0;q<6;q++){V=gt[q].mipmaps;for(let lt=0;lt<V.length;lt++){const dt=V[lt];x.format!==an?It!==null?Ot?L&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt,0,0,dt.width,dt.height,It,dt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt,Ht,dt.width,dt.height,0,dt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt,0,0,dt.width,dt.height,It,_t,dt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt,Ht,dt.width,dt.height,0,It,_t,dt.data)}}}else{if(V=x.mipmaps,Ot&&le){V.length>0&&ht++;const q=Dt(gt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ht,Ht,q.width,q.height)}for(let q=0;q<6;q++)if(nt){Ot?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,gt[q].width,gt[q].height,It,_t,gt[q].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Ht,gt[q].width,gt[q].height,0,It,_t,gt[q].data);for(let lt=0;lt<V.length;lt++){const Yt=V[lt].image[q].image;Ot?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt+1,0,0,Yt.width,Yt.height,It,_t,Yt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt+1,Ht,Yt.width,Yt.height,0,It,_t,Yt.data)}}else{Ot?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,It,_t,gt[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Ht,It,_t,gt[q]);for(let lt=0;lt<V.length;lt++){const dt=V[lt];Ot?L&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt+1,0,0,It,_t,dt.image[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,lt+1,Ht,It,_t,dt.image[q])}}}p(x)&&f(i.TEXTURE_CUBE_MAP),K.__version=Q.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function et(C,x,F,$,Q,K){const St=r.convert(F.format,F.colorSpace),at=r.convert(F.type),mt=y(F.internalFormat,St,at,F.colorSpace);if(!n.get(x).__hasExternalTextures){const nt=Math.max(1,x.width>>K),gt=Math.max(1,x.height>>K);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,K,mt,nt,gt,x.depth,0,St,at,null):e.texImage2D(Q,K,mt,nt,gt,0,St,at,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),Kt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,$,Q,n.get(F).__webglTexture,0,zt(x)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,$,Q,n.get(F).__webglTexture,K),e.bindFramebuffer(i.FRAMEBUFFER,null)}function xt(C,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,C),x.depthBuffer){const $=x.depthTexture,Q=$&&$.isDepthTexture?$.type:null,K=M(x.stencilBuffer,Q),St=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,at=zt(x);Kt(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,at,K,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,at,K,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,K,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,St,i.RENDERBUFFER,C)}else{const $=x.textures;for(let Q=0;Q<$.length;Q++){const K=$[Q],St=r.convert(K.format,K.colorSpace),at=r.convert(K.type),mt=y(K.internalFormat,St,at,K.colorSpace),$t=zt(x);F&&Kt(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,$t,mt,x.width,x.height):Kt(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,$t,mt,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,mt,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function pt(C,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(x.depthTexture).__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),X(x.depthTexture,0);const $=n.get(x.depthTexture).__webglTexture,Q=zt(x);if(x.depthTexture.format===Ci)Kt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,$,0,Q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,$,0);else if(x.depthTexture.format===Ni)Kt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,$,0,Q):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,$,0);else throw new Error("Unknown depthTexture format")}function Ft(C){const x=n.get(C),F=C.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==C.depthTexture){const $=C.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),$){const Q=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,$.removeEventListener("dispose",Q)};$.addEventListener("dispose",Q),x.__depthDisposeCallback=Q}x.__boundDepthTexture=$}if(C.depthTexture&&!x.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");pt(x.__webglFramebuffer,C)}else if(F){x.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[$]),x.__webglDepthbuffer[$]===void 0)x.__webglDepthbuffer[$]=i.createRenderbuffer(),xt(x.__webglDepthbuffer[$],C,!1);else{const Q=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=x.__webglDepthbuffer[$];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,K)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),xt(x.__webglDepthbuffer,C,!1);else{const $=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Q=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Q),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,Q)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function At(C,x,F){const $=n.get(C);x!==void 0&&et($.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Ft(C)}function Wt(C){const x=C.texture,F=n.get(C),$=n.get(x);C.addEventListener("dispose",A);const Q=C.textures,K=C.isWebGLCubeRenderTarget===!0,St=Q.length>1;if(St||($.__webglTexture===void 0&&($.__webglTexture=i.createTexture()),$.__version=x.version,a.memory.textures++),K){F.__webglFramebuffer=[];for(let at=0;at<6;at++)if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer[at]=[];for(let mt=0;mt<x.mipmaps.length;mt++)F.__webglFramebuffer[at][mt]=i.createFramebuffer()}else F.__webglFramebuffer[at]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer=[];for(let at=0;at<x.mipmaps.length;at++)F.__webglFramebuffer[at]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(St)for(let at=0,mt=Q.length;at<mt;at++){const $t=n.get(Q[at]);$t.__webglTexture===void 0&&($t.__webglTexture=i.createTexture(),a.memory.textures++)}if(C.samples>0&&Kt(C)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let at=0;at<Q.length;at++){const mt=Q[at];F.__webglColorRenderbuffer[at]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[at]);const $t=r.convert(mt.format,mt.colorSpace),nt=r.convert(mt.type),gt=y(mt.internalFormat,$t,nt,mt.colorSpace,C.isXRRenderTarget===!0),Pt=zt(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,Pt,gt,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,F.__webglColorRenderbuffer[at])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),xt(F.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),yt(i.TEXTURE_CUBE_MAP,x);for(let at=0;at<6;at++)if(x.mipmaps&&x.mipmaps.length>0)for(let mt=0;mt<x.mipmaps.length;mt++)et(F.__webglFramebuffer[at][mt],C,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+at,mt);else et(F.__webglFramebuffer[at],C,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0);p(x)&&f(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(St){for(let at=0,mt=Q.length;at<mt;at++){const $t=Q[at],nt=n.get($t);e.bindTexture(i.TEXTURE_2D,nt.__webglTexture),yt(i.TEXTURE_2D,$t),et(F.__webglFramebuffer,C,$t,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,0),p($t)&&f(i.TEXTURE_2D)}e.unbindTexture()}else{let at=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(at=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(at,$.__webglTexture),yt(at,x),x.mipmaps&&x.mipmaps.length>0)for(let mt=0;mt<x.mipmaps.length;mt++)et(F.__webglFramebuffer[mt],C,x,i.COLOR_ATTACHMENT0,at,mt);else et(F.__webglFramebuffer,C,x,i.COLOR_ATTACHMENT0,at,0);p(x)&&f(at),e.unbindTexture()}C.depthBuffer&&Ft(C)}function ie(C){const x=C.textures;for(let F=0,$=x.length;F<$;F++){const Q=x[F];if(p(Q)){const K=C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,St=n.get(Q).__webglTexture;e.bindTexture(K,St),f(K),e.unbindTexture()}}}const Xt=[],I=[];function ze(C){if(C.samples>0){if(Kt(C)===!1){const x=C.textures,F=C.width,$=C.height;let Q=i.COLOR_BUFFER_BIT;const K=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,St=n.get(C),at=x.length>1;if(at)for(let mt=0;mt<x.length;mt++)e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,St.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglFramebuffer);for(let mt=0;mt<x.length;mt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),at){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,St.__webglColorRenderbuffer[mt]);const $t=n.get(x[mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,$t,0)}i.blitFramebuffer(0,0,F,$,0,0,F,$,Q,i.NEAREST),l===!0&&(Xt.length=0,I.length=0,Xt.push(i.COLOR_ATTACHMENT0+mt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(Xt.push(K),I.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,I)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Xt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),at)for(let mt=0;mt<x.length;mt++){e.bindFramebuffer(i.FRAMEBUFFER,St.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,St.__webglColorRenderbuffer[mt]);const $t=n.get(x[mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,St.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,$t,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,St.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const x=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function zt(C){return Math.min(s.maxSamples,C.samples)}function Kt(C){const x=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Rt(C){const x=a.render.frame;h.get(C)!==x&&(h.set(C,x),C.update())}function he(C,x){const F=C.colorSpace,$=C.format,Q=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||F!==Vn&&F!==Bn&&(Jt.getTransfer(F)===ce?($!==an||Q!==Cn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),x}function Dt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=O,this.resetTextureUnits=E,this.setTexture2D=X,this.setTexture2DArray=Z,this.setTexture3D=G,this.setTextureCube=J,this.rebindTextures=At,this.setupRenderTarget=Wt,this.updateRenderTargetMipmap=ie,this.updateMultisampleRenderTarget=ze,this.setupDepthRenderbuffer=Ft,this.setupFrameBufferTexture=et,this.useMultisampledRTT=Kt}function eg(i,t){function e(n,s=Bn){let r;const a=Jt.getTransfer(s);if(n===Cn)return i.UNSIGNED_BYTE;if(n===ao)return i.UNSIGNED_SHORT_4_4_4_4;if(n===oo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===wc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ec)return i.BYTE;if(n===bc)return i.SHORT;if(n===as)return i.UNSIGNED_SHORT;if(n===ro)return i.INT;if(n===si)return i.UNSIGNED_INT;if(n===dn)return i.FLOAT;if(n===Tn)return i.HALF_FLOAT;if(n===Tc)return i.ALPHA;if(n===Ac)return i.RGB;if(n===an)return i.RGBA;if(n===Cc)return i.LUMINANCE;if(n===Rc)return i.LUMINANCE_ALPHA;if(n===Ci)return i.DEPTH_COMPONENT;if(n===Ni)return i.DEPTH_STENCIL;if(n===lo)return i.RED;if(n===co)return i.RED_INTEGER;if(n===Pc)return i.RG;if(n===ho)return i.RG_INTEGER;if(n===uo)return i.RGBA_INTEGER;if(n===Ks||n===$s||n===qs||n===Zs)if(a===ce)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ks)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===$s)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===qs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Zs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ks)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===$s)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===qs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Zs)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ma||n===ya||n===Sa||n===Ea)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ma)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ya)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Sa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ea)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ba||n===wa||n===Ta)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===ba||n===wa)return a===ce?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ta)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Aa||n===Ca||n===Ra||n===Pa||n===Ia||n===La||n===Da||n===Ua||n===Na||n===Fa||n===Oa||n===ka||n===Ba||n===za)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Aa)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ca)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ra)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Pa)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ia)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===La)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Da)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ua)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Na)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Fa)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Oa)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ka)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ba)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===za)return a===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===js||n===Ha||n===Ga)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===js)return a===ce?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ha)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ga)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ic||n===Va||n===Wa||n===Xa)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===js)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Va)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Wa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Xa)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ui?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class ng extends Ye{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class pe extends ye{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ig={type:"move"};class qr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new w,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new w),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new w,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new w),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const v of t.hand.values()){const p=e.getJointPose(v,n),f=this._getHandJoint(c,v);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),m=.02,g=.005;c.inputState.pinching&&u>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ig)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new pe;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const sg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,rg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class ag{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Pe,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Re({vertexShader:sg,fragmentShader:rg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Nt(new Bi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class og extends ri{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,m=null,g=null;const v=new ag,p=e.getContextAttributes();let f=null,y=null;const M=[],b=[],R=new tt;let A=null;const T=new Ye;T.layers.enable(1),T.viewport=new ae;const P=new Ye;P.layers.enable(2),P.viewport=new ae;const z=[T,P],_=new ng;_.layers.enable(1),_.layers.enable(2);let E=null,O=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let et=M[Y];return et===void 0&&(et=new qr,M[Y]=et),et.getTargetRaySpace()},this.getControllerGrip=function(Y){let et=M[Y];return et===void 0&&(et=new qr,M[Y]=et),et.getGripSpace()},this.getHand=function(Y){let et=M[Y];return et===void 0&&(et=new qr,M[Y]=et),et.getHandSpace()};function H(Y){const et=b.indexOf(Y.inputSource);if(et===-1)return;const xt=M[et];xt!==void 0&&(xt.update(Y.inputSource,Y.frame,c||a),xt.dispatchEvent({type:Y.type,data:Y.inputSource}))}function X(){s.removeEventListener("select",H),s.removeEventListener("selectstart",H),s.removeEventListener("selectend",H),s.removeEventListener("squeeze",H),s.removeEventListener("squeezestart",H),s.removeEventListener("squeezeend",H),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",Z);for(let Y=0;Y<M.length;Y++){const et=b[Y];et!==null&&(b[Y]=null,M[Y].disconnect(et))}E=null,O=null,v.reset(),t.setRenderTarget(f),m=null,u=null,d=null,s=null,y=null,ee.stop(),n.isPresenting=!1,t.setPixelRatio(A),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(f=t.getRenderTarget(),s.addEventListener("select",H),s.addEventListener("selectstart",H),s.addEventListener("selectend",H),s.addEventListener("squeeze",H),s.addEventListener("squeezestart",H),s.addEventListener("squeezeend",H),s.addEventListener("end",X),s.addEventListener("inputsourceschange",Z),p.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(R),s.renderState.layers===void 0){const et={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,et),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),y=new ln(m.framebufferWidth,m.framebufferHeight,{format:an,type:Cn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let et=null,xt=null,pt=null;p.depth&&(pt=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,et=p.stencil?Ni:Ci,xt=p.stencil?Ui:si);const Ft={colorFormat:e.RGBA8,depthFormat:pt,scaleFactor:r};d=new XRWebGLBinding(s,e),u=d.createProjectionLayer(Ft),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),y=new ln(u.textureWidth,u.textureHeight,{format:an,type:Cn,depthTexture:new Wc(u.textureWidth,u.textureHeight,xt,void 0,void 0,void 0,void 0,void 0,void 0,et),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),ee.setContext(s),ee.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function Z(Y){for(let et=0;et<Y.removed.length;et++){const xt=Y.removed[et],pt=b.indexOf(xt);pt>=0&&(b[pt]=null,M[pt].disconnect(xt))}for(let et=0;et<Y.added.length;et++){const xt=Y.added[et];let pt=b.indexOf(xt);if(pt===-1){for(let At=0;At<M.length;At++)if(At>=b.length){b.push(xt),pt=At;break}else if(b[At]===null){b[At]=xt,pt=At;break}if(pt===-1)break}const Ft=M[pt];Ft&&Ft.connect(xt)}}const G=new w,J=new w;function W(Y,et,xt){G.setFromMatrixPosition(et.matrixWorld),J.setFromMatrixPosition(xt.matrixWorld);const pt=G.distanceTo(J),Ft=et.projectionMatrix.elements,At=xt.projectionMatrix.elements,Wt=Ft[14]/(Ft[10]-1),ie=Ft[14]/(Ft[10]+1),Xt=(Ft[9]+1)/Ft[5],I=(Ft[9]-1)/Ft[5],ze=(Ft[8]-1)/Ft[0],zt=(At[8]+1)/At[0],Kt=Wt*ze,Rt=Wt*zt,he=pt/(-ze+zt),Dt=he*-ze;if(et.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(Dt),Y.translateZ(he),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Ft[10]===-1)Y.projectionMatrix.copy(et.projectionMatrix),Y.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{const C=Wt+he,x=ie+he,F=Kt-Dt,$=Rt+(pt-Dt),Q=Xt*ie/x*C,K=I*ie/x*C;Y.projectionMatrix.makePerspective(F,$,Q,K,C,x),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function ut(Y,et){et===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(et.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let et=Y.near,xt=Y.far;v.texture!==null&&(v.depthNear>0&&(et=v.depthNear),v.depthFar>0&&(xt=v.depthFar)),_.near=P.near=T.near=et,_.far=P.far=T.far=xt,(E!==_.near||O!==_.far)&&(s.updateRenderState({depthNear:_.near,depthFar:_.far}),E=_.near,O=_.far);const pt=Y.parent,Ft=_.cameras;ut(_,pt);for(let At=0;At<Ft.length;At++)ut(Ft[At],pt);Ft.length===2?W(_,T,P):_.projectionMatrix.copy(T.projectionMatrix),ft(Y,_,pt)};function ft(Y,et,xt){xt===null?Y.matrix.copy(et.matrixWorld):(Y.matrix.copy(xt.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(et.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(et.projectionMatrix),Y.projectionMatrixInverse.copy(et.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Ya*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(u===null&&m===null))return l},this.setFoveation=function(Y){l=Y,u!==null&&(u.fixedFoveation=Y),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=Y)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let yt=null;function Zt(Y,et){if(h=et.getViewerPose(c||a),g=et,h!==null){const xt=h.views;m!==null&&(t.setRenderTargetFramebuffer(y,m.framebuffer),t.setRenderTarget(y));let pt=!1;xt.length!==_.cameras.length&&(_.cameras.length=0,pt=!0);for(let At=0;At<xt.length;At++){const Wt=xt[At];let ie=null;if(m!==null)ie=m.getViewport(Wt);else{const I=d.getViewSubImage(u,Wt);ie=I.viewport,At===0&&(t.setRenderTargetTextures(y,I.colorTexture,u.ignoreDepthValues?void 0:I.depthStencilTexture),t.setRenderTarget(y))}let Xt=z[At];Xt===void 0&&(Xt=new Ye,Xt.layers.enable(At),Xt.viewport=new ae,z[At]=Xt),Xt.matrix.fromArray(Wt.transform.matrix),Xt.matrix.decompose(Xt.position,Xt.quaternion,Xt.scale),Xt.projectionMatrix.fromArray(Wt.projectionMatrix),Xt.projectionMatrixInverse.copy(Xt.projectionMatrix).invert(),Xt.viewport.set(ie.x,ie.y,ie.width,ie.height),At===0&&(_.matrix.copy(Xt.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),pt===!0&&_.cameras.push(Xt)}const Ft=s.enabledFeatures;if(Ft&&Ft.includes("depth-sensing")){const At=d.getDepthInformation(xt[0]);At&&At.isValid&&At.texture&&v.init(t,At,s.renderState)}}for(let xt=0;xt<M.length;xt++){const pt=b[xt],Ft=M[xt];pt!==null&&Ft!==void 0&&Ft.update(pt,et,c||a)}yt&&yt(Y,et),et.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:et}),g=null}const ee=new Vc;ee.setAnimationLoop(Zt),this.setAnimationLoop=function(Y){yt=Y},this.dispose=function(){}}}const jn=new pn,lg=new Vt;function cg(i,t){function e(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,zc(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,y,M,b){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),d(p,f)):f.isMeshPhongMaterial?(r(p,f),h(p,f)):f.isMeshStandardMaterial?(r(p,f),u(p,f),f.isMeshPhysicalMaterial&&m(p,f,b)):f.isMeshMatcapMaterial?(r(p,f),g(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),v(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(a(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?l(p,f,y,M):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,e(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===Le&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,e(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===Le&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,e(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,e(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);const y=t.get(f),M=y.envMap,b=y.envMapRotation;M&&(p.envMap.value=M,jn.copy(b),jn.x*=-1,jn.y*=-1,jn.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(jn.y*=-1,jn.z*=-1),p.envMapRotation.value.setFromMatrix4(lg.makeRotationFromEuler(jn)),p.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,p.aoMapTransform))}function a(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform))}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,y,M){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*y,p.scale.value=M*.5,f.map&&(p.map.value=f.map,e(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function h(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function d(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function u(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,y){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Le&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=y.texture,p.transmissionSamplerSize.value.set(y.width,y.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,f){f.matcap&&(p.matcap.value=f.matcap)}function v(p,f){const y=t.get(f).light;p.referencePosition.value.setFromMatrixPosition(y.matrixWorld),p.nearDistance.value=y.shadow.camera.near,p.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function hg(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,M){const b=M.program;n.uniformBlockBinding(y,b)}function c(y,M){let b=s[y.id];b===void 0&&(g(y),b=h(y),s[y.id]=b,y.addEventListener("dispose",p));const R=M.program;n.updateUBOMapping(y,R);const A=t.render.frame;r[y.id]!==A&&(u(y),r[y.id]=A)}function h(y){const M=d();y.__bindingPointIndex=M;const b=i.createBuffer(),R=y.__size,A=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,R,A),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,b),b}function d(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(y){const M=s[y.id],b=y.uniforms,R=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let A=0,T=b.length;A<T;A++){const P=Array.isArray(b[A])?b[A]:[b[A]];for(let z=0,_=P.length;z<_;z++){const E=P[z];if(m(E,A,z,R)===!0){const O=E.__offset,H=Array.isArray(E.value)?E.value:[E.value];let X=0;for(let Z=0;Z<H.length;Z++){const G=H[Z],J=v(G);typeof G=="number"||typeof G=="boolean"?(E.__data[0]=G,i.bufferSubData(i.UNIFORM_BUFFER,O+X,E.__data)):G.isMatrix3?(E.__data[0]=G.elements[0],E.__data[1]=G.elements[1],E.__data[2]=G.elements[2],E.__data[3]=0,E.__data[4]=G.elements[3],E.__data[5]=G.elements[4],E.__data[6]=G.elements[5],E.__data[7]=0,E.__data[8]=G.elements[6],E.__data[9]=G.elements[7],E.__data[10]=G.elements[8],E.__data[11]=0):(G.toArray(E.__data,X),X+=J.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,O,E.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,M,b,R){const A=y.value,T=M+"_"+b;if(R[T]===void 0)return typeof A=="number"||typeof A=="boolean"?R[T]=A:R[T]=A.clone(),!0;{const P=R[T];if(typeof A=="number"||typeof A=="boolean"){if(P!==A)return R[T]=A,!0}else if(P.equals(A)===!1)return P.copy(A),!0}return!1}function g(y){const M=y.uniforms;let b=0;const R=16;for(let T=0,P=M.length;T<P;T++){const z=Array.isArray(M[T])?M[T]:[M[T]];for(let _=0,E=z.length;_<E;_++){const O=z[_],H=Array.isArray(O.value)?O.value:[O.value];for(let X=0,Z=H.length;X<Z;X++){const G=H[X],J=v(G),W=b%R,ut=W%J.boundary,ft=W+ut;b+=ut,ft!==0&&R-ft<J.storage&&(b+=R-ft),O.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),O.__offset=b,b+=J.storage}}}const A=b%R;return A>0&&(b+=R-A),y.__size=b,y.__cache={},this}function v(y){const M={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(M.boundary=4,M.storage=4):y.isVector2?(M.boundary=8,M.storage=8):y.isVector3||y.isColor?(M.boundary=16,M.storage=12):y.isVector4?(M.boundary=16,M.storage=16):y.isMatrix3?(M.boundary=48,M.storage=48):y.isMatrix4?(M.boundary=64,M.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),M}function p(y){const M=y.target;M.removeEventListener("dispose",p);const b=a.indexOf(M.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function f(){for(const y in s)i.deleteBuffer(s[y]);a=[],s={},r={}}return{bind:l,update:c,dispose:f}}class dg{constructor(t={}){const{canvas:e=Jh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=a;const m=new Uint32Array(4),g=new Int32Array(4);let v=null,p=null;const f=[],y=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=en,this.toneMapping=zn,this.toneMappingExposure=1;const M=this;let b=!1,R=0,A=0,T=null,P=-1,z=null;const _=new ae,E=new ae;let O=null;const H=new ot(0);let X=0,Z=e.width,G=e.height,J=1,W=null,ut=null;const ft=new ae(0,0,Z,G),yt=new ae(0,0,Z,G);let Zt=!1;const ee=new mo;let Y=!1,et=!1;const xt=new Vt,pt=new Vt,Ft=new w,At=new ae,Wt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ie=!1;function Xt(){return T===null?J:1}let I=n;function ze(S,D){return e.getContext(S,D)}try{const S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${io}`),e.addEventListener("webglcontextlost",q,!1),e.addEventListener("webglcontextrestored",lt,!1),e.addEventListener("webglcontextcreationerror",dt,!1),I===null){const D="webgl2";if(I=ze(D,S),I===null)throw ze(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let zt,Kt,Rt,he,Dt,C,x,F,$,Q,K,St,at,mt,$t,nt,gt,Pt,It,_t,Ht,Ot,le,L;function ht(){zt=new gp(I),zt.init(),Ot=new eg(I,zt),Kt=new hp(I,zt,t,Ot),Rt=new Jm(I),Kt.reverseDepthBuffer&&Rt.buffers.depth.setReversed(!0),he=new xp(I),Dt=new Om,C=new tg(I,zt,Rt,Dt,Kt,Ot,he),x=new up(M),F=new mp(M),$=new wd(I),le=new lp(I,$),Q=new _p(I,$,he,le),K=new yp(I,Q,$,he),It=new Mp(I,Kt,C),nt=new dp(Dt),St=new Fm(M,x,F,zt,Kt,le,nt),at=new cg(M,Dt),mt=new Bm,$t=new Xm(zt),Pt=new op(M,x,F,Rt,K,u,l),gt=new Zm(M,K,Kt),L=new hg(I,he,Kt,Rt),_t=new cp(I,zt,he),Ht=new vp(I,zt,he),he.programs=St.programs,M.capabilities=Kt,M.extensions=zt,M.properties=Dt,M.renderLists=mt,M.shadowMap=gt,M.state=Rt,M.info=he}ht();const V=new og(M,I);this.xr=V,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const S=zt.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=zt.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return J},this.setPixelRatio=function(S){S!==void 0&&(J=S,this.setSize(Z,G,!1))},this.getSize=function(S){return S.set(Z,G)},this.setSize=function(S,D,k=!0){if(V.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Z=S,G=D,e.width=Math.floor(S*J),e.height=Math.floor(D*J),k===!0&&(e.style.width=S+"px",e.style.height=D+"px"),this.setViewport(0,0,S,D)},this.getDrawingBufferSize=function(S){return S.set(Z*J,G*J).floor()},this.setDrawingBufferSize=function(S,D,k){Z=S,G=D,J=k,e.width=Math.floor(S*k),e.height=Math.floor(D*k),this.setViewport(0,0,S,D)},this.getCurrentViewport=function(S){return S.copy(_)},this.getViewport=function(S){return S.copy(ft)},this.setViewport=function(S,D,k,B){S.isVector4?ft.set(S.x,S.y,S.z,S.w):ft.set(S,D,k,B),Rt.viewport(_.copy(ft).multiplyScalar(J).round())},this.getScissor=function(S){return S.copy(yt)},this.setScissor=function(S,D,k,B){S.isVector4?yt.set(S.x,S.y,S.z,S.w):yt.set(S,D,k,B),Rt.scissor(E.copy(yt).multiplyScalar(J).round())},this.getScissorTest=function(){return Zt},this.setScissorTest=function(S){Rt.setScissorTest(Zt=S)},this.setOpaqueSort=function(S){W=S},this.setTransparentSort=function(S){ut=S},this.getClearColor=function(S){return S.copy(Pt.getClearColor())},this.setClearColor=function(){Pt.setClearColor.apply(Pt,arguments)},this.getClearAlpha=function(){return Pt.getClearAlpha()},this.setClearAlpha=function(){Pt.setClearAlpha.apply(Pt,arguments)},this.clear=function(S=!0,D=!0,k=!0){let B=0;if(S){let U=!1;if(T!==null){const it=T.texture.format;U=it===uo||it===ho||it===co}if(U){const it=T.texture.type,ct=it===Cn||it===si||it===as||it===Ui||it===ao||it===oo,vt=Pt.getClearColor(),Mt=Pt.getClearAlpha(),Tt=vt.r,Ct=vt.g,Et=vt.b;ct?(m[0]=Tt,m[1]=Ct,m[2]=Et,m[3]=Mt,I.clearBufferuiv(I.COLOR,0,m)):(g[0]=Tt,g[1]=Ct,g[2]=Et,g[3]=Mt,I.clearBufferiv(I.COLOR,0,g))}else B|=I.COLOR_BUFFER_BIT}D&&(B|=I.DEPTH_BUFFER_BIT,I.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),k&&(B|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",q,!1),e.removeEventListener("webglcontextrestored",lt,!1),e.removeEventListener("webglcontextcreationerror",dt,!1),mt.dispose(),$t.dispose(),Dt.dispose(),x.dispose(),F.dispose(),K.dispose(),le.dispose(),L.dispose(),St.dispose(),V.dispose(),V.removeEventListener("sessionstart",Uo),V.removeEventListener("sessionend",No),Xn.stop()};function q(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function lt(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;const S=he.autoReset,D=gt.enabled,k=gt.autoUpdate,B=gt.needsUpdate,U=gt.type;ht(),he.autoReset=S,gt.enabled=D,gt.autoUpdate=k,gt.needsUpdate=B,gt.type=U}function dt(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Yt(S){const D=S.target;D.removeEventListener("dispose",Yt),_e(D)}function _e(S){Ue(S),Dt.remove(S)}function Ue(S){const D=Dt.get(S).programs;D!==void 0&&(D.forEach(function(k){St.releaseProgram(k)}),S.isShaderMaterial&&St.releaseShaderCache(S))}this.renderBufferDirect=function(S,D,k,B,U,it){D===null&&(D=Wt);const ct=U.isMesh&&U.matrixWorld.determinant()<0,vt=hh(S,D,k,B,U);Rt.setMaterial(B,ct);let Mt=k.index,Tt=1;if(B.wireframe===!0){if(Mt=Q.getWireframeAttribute(k),Mt===void 0)return;Tt=2}const Ct=k.drawRange,Et=k.attributes.position;let ne=Ct.start*Tt,de=(Ct.start+Ct.count)*Tt;it!==null&&(ne=Math.max(ne,it.start*Tt),de=Math.min(de,(it.start+it.count)*Tt)),Mt!==null?(ne=Math.max(ne,0),de=Math.min(de,Mt.count)):Et!=null&&(ne=Math.max(ne,0),de=Math.min(de,Et.count));const me=de-ne;if(me<0||me===1/0)return;le.setup(U,B,vt,k,Mt);let He,Qt=_t;if(Mt!==null&&(He=$.get(Mt),Qt=Ht,Qt.setIndex(He)),U.isMesh)B.wireframe===!0?(Rt.setLineWidth(B.wireframeLinewidth*Xt()),Qt.setMode(I.LINES)):Qt.setMode(I.TRIANGLES);else if(U.isLine){let bt=B.linewidth;bt===void 0&&(bt=1),Rt.setLineWidth(bt*Xt()),U.isLineSegments?Qt.setMode(I.LINES):U.isLineLoop?Qt.setMode(I.LINE_LOOP):Qt.setMode(I.LINE_STRIP)}else U.isPoints?Qt.setMode(I.POINTS):U.isSprite&&Qt.setMode(I.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)Qt.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(zt.get("WEBGL_multi_draw"))Qt.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const bt=U._multiDrawStarts,Te=U._multiDrawCounts,te=U._multiDrawCount,je=Mt?$.get(Mt).bytesPerElement:1,oi=Dt.get(B).currentProgram.getUniforms();for(let Ge=0;Ge<te;Ge++)oi.setValue(I,"_gl_DrawID",Ge),Qt.render(bt[Ge]/je,Te[Ge])}else if(U.isInstancedMesh)Qt.renderInstances(ne,me,U.count);else if(k.isInstancedBufferGeometry){const bt=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Te=Math.min(k.instanceCount,bt);Qt.renderInstances(ne,me,Te)}else Qt.render(ne,me)};function jt(S,D,k){S.transparent===!0&&S.side===nn&&S.forceSinglePass===!1?(S.side=Le,S.needsUpdate=!0,ps(S,D,k),S.side=Hn,S.needsUpdate=!0,ps(S,D,k),S.side=nn):ps(S,D,k)}this.compile=function(S,D,k=null){k===null&&(k=S),p=$t.get(k),p.init(D),y.push(p),k.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),S!==k&&S.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights();const B=new Set;return S.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const it=U.material;if(it)if(Array.isArray(it))for(let ct=0;ct<it.length;ct++){const vt=it[ct];jt(vt,k,U),B.add(vt)}else jt(it,k,U),B.add(it)}),y.pop(),p=null,B},this.compileAsync=function(S,D,k=null){const B=this.compile(S,D,k);return new Promise(U=>{function it(){if(B.forEach(function(ct){Dt.get(ct).currentProgram.isReady()&&B.delete(ct)}),B.size===0){U(S);return}setTimeout(it,10)}zt.get("KHR_parallel_shader_compile")!==null?it():setTimeout(it,10)})};let Ne=null;function _n(S){Ne&&Ne(S)}function Uo(){Xn.stop()}function No(){Xn.start()}const Xn=new Vc;Xn.setAnimationLoop(_n),typeof self<"u"&&Xn.setContext(self),this.setAnimationLoop=function(S){Ne=S,V.setAnimationLoop(S),S===null?Xn.stop():Xn.start()},V.addEventListener("sessionstart",Uo),V.addEventListener("sessionend",No),this.render=function(S,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),V.enabled===!0&&V.isPresenting===!0&&(V.cameraAutoUpdate===!0&&V.updateCamera(D),D=V.getCamera()),S.isScene===!0&&S.onBeforeRender(M,S,D,T),p=$t.get(S,y.length),p.init(D),y.push(p),pt.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),ee.setFromProjectionMatrix(pt),et=this.localClippingEnabled,Y=nt.init(this.clippingPlanes,et),v=mt.get(S,f.length),v.init(),f.push(v),V.enabled===!0&&V.isPresenting===!0){const it=M.xr.getDepthSensingMesh();it!==null&&gr(it,D,-1/0,M.sortObjects)}gr(S,D,0,M.sortObjects),v.finish(),M.sortObjects===!0&&v.sort(W,ut),ie=V.enabled===!1||V.isPresenting===!1||V.hasDepthSensing()===!1,ie&&Pt.addToRenderList(v,S),this.info.render.frame++,Y===!0&&nt.beginShadows();const k=p.state.shadowsArray;gt.render(k,S,D),Y===!0&&nt.endShadows(),this.info.autoReset===!0&&this.info.reset();const B=v.opaque,U=v.transmissive;if(p.setupLights(),D.isArrayCamera){const it=D.cameras;if(U.length>0)for(let ct=0,vt=it.length;ct<vt;ct++){const Mt=it[ct];Oo(B,U,S,Mt)}ie&&Pt.render(S);for(let ct=0,vt=it.length;ct<vt;ct++){const Mt=it[ct];Fo(v,S,Mt,Mt.viewport)}}else U.length>0&&Oo(B,U,S,D),ie&&Pt.render(S),Fo(v,S,D);T!==null&&(C.updateMultisampleRenderTarget(T),C.updateRenderTargetMipmap(T)),S.isScene===!0&&S.onAfterRender(M,S,D),le.resetDefaultState(),P=-1,z=null,y.pop(),y.length>0?(p=y[y.length-1],Y===!0&&nt.setGlobalState(M.clippingPlanes,p.state.camera)):p=null,f.pop(),f.length>0?v=f[f.length-1]:v=null};function gr(S,D,k,B){if(S.visible===!1)return;if(S.layers.test(D.layers)){if(S.isGroup)k=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(D);else if(S.isLight)p.pushLight(S),S.castShadow&&p.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||ee.intersectsSprite(S)){B&&At.setFromMatrixPosition(S.matrixWorld).applyMatrix4(pt);const ct=K.update(S),vt=S.material;vt.visible&&v.push(S,ct,vt,k,At.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||ee.intersectsObject(S))){const ct=K.update(S),vt=S.material;if(B&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),At.copy(S.boundingSphere.center)):(ct.boundingSphere===null&&ct.computeBoundingSphere(),At.copy(ct.boundingSphere.center)),At.applyMatrix4(S.matrixWorld).applyMatrix4(pt)),Array.isArray(vt)){const Mt=ct.groups;for(let Tt=0,Ct=Mt.length;Tt<Ct;Tt++){const Et=Mt[Tt],ne=vt[Et.materialIndex];ne&&ne.visible&&v.push(S,ct,ne,k,At.z,Et)}}else vt.visible&&v.push(S,ct,vt,k,At.z,null)}}const it=S.children;for(let ct=0,vt=it.length;ct<vt;ct++)gr(it[ct],D,k,B)}function Fo(S,D,k,B){const U=S.opaque,it=S.transmissive,ct=S.transparent;p.setupLightsView(k),Y===!0&&nt.setGlobalState(M.clippingPlanes,k),B&&Rt.viewport(_.copy(B)),U.length>0&&fs(U,D,k),it.length>0&&fs(it,D,k),ct.length>0&&fs(ct,D,k),Rt.buffers.depth.setTest(!0),Rt.buffers.depth.setMask(!0),Rt.buffers.color.setMask(!0),Rt.setPolygonOffset(!1)}function Oo(S,D,k,B){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[B.id]===void 0&&(p.state.transmissionRenderTarget[B.id]=new ln(1,1,{generateMipmaps:!0,type:zt.has("EXT_color_buffer_half_float")||zt.has("EXT_color_buffer_float")?Tn:Cn,minFilter:ii,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Jt.workingColorSpace}));const it=p.state.transmissionRenderTarget[B.id],ct=B.viewport||_;it.setSize(ct.z,ct.w);const vt=M.getRenderTarget();M.setRenderTarget(it),M.getClearColor(H),X=M.getClearAlpha(),X<1&&M.setClearColor(16777215,.5),M.clear(),ie&&Pt.render(k);const Mt=M.toneMapping;M.toneMapping=zn;const Tt=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),p.setupLightsView(B),Y===!0&&nt.setGlobalState(M.clippingPlanes,B),fs(S,k,B),C.updateMultisampleRenderTarget(it),C.updateRenderTargetMipmap(it),zt.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let Et=0,ne=D.length;Et<ne;Et++){const de=D[Et],me=de.object,He=de.geometry,Qt=de.material,bt=de.group;if(Qt.side===nn&&me.layers.test(B.layers)){const Te=Qt.side;Qt.side=Le,Qt.needsUpdate=!0,ko(me,k,B,He,Qt,bt),Qt.side=Te,Qt.needsUpdate=!0,Ct=!0}}Ct===!0&&(C.updateMultisampleRenderTarget(it),C.updateRenderTargetMipmap(it))}M.setRenderTarget(vt),M.setClearColor(H,X),Tt!==void 0&&(B.viewport=Tt),M.toneMapping=Mt}function fs(S,D,k){const B=D.isScene===!0?D.overrideMaterial:null;for(let U=0,it=S.length;U<it;U++){const ct=S[U],vt=ct.object,Mt=ct.geometry,Tt=B===null?ct.material:B,Ct=ct.group;vt.layers.test(k.layers)&&ko(vt,D,k,Mt,Tt,Ct)}}function ko(S,D,k,B,U,it){S.onBeforeRender(M,D,k,B,U,it),S.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),U.onBeforeRender(M,D,k,B,S,it),U.transparent===!0&&U.side===nn&&U.forceSinglePass===!1?(U.side=Le,U.needsUpdate=!0,M.renderBufferDirect(k,D,B,U,S,it),U.side=Hn,U.needsUpdate=!0,M.renderBufferDirect(k,D,B,U,S,it),U.side=nn):M.renderBufferDirect(k,D,B,U,S,it),S.onAfterRender(M,D,k,B,U,it)}function ps(S,D,k){D.isScene!==!0&&(D=Wt);const B=Dt.get(S),U=p.state.lights,it=p.state.shadowsArray,ct=U.state.version,vt=St.getParameters(S,U.state,it,D,k),Mt=St.getProgramCacheKey(vt);let Tt=B.programs;B.environment=S.isMeshStandardMaterial?D.environment:null,B.fog=D.fog,B.envMap=(S.isMeshStandardMaterial?F:x).get(S.envMap||B.environment),B.envMapRotation=B.environment!==null&&S.envMap===null?D.environmentRotation:S.envMapRotation,Tt===void 0&&(S.addEventListener("dispose",Yt),Tt=new Map,B.programs=Tt);let Ct=Tt.get(Mt);if(Ct!==void 0){if(B.currentProgram===Ct&&B.lightsStateVersion===ct)return zo(S,vt),Ct}else vt.uniforms=St.getUniforms(S),S.onBeforeCompile(vt,M),Ct=St.acquireProgram(vt,Mt),Tt.set(Mt,Ct),B.uniforms=vt.uniforms;const Et=B.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Et.clippingPlanes=nt.uniform),zo(S,vt),B.needsLights=uh(S),B.lightsStateVersion=ct,B.needsLights&&(Et.ambientLightColor.value=U.state.ambient,Et.lightProbe.value=U.state.probe,Et.directionalLights.value=U.state.directional,Et.directionalLightShadows.value=U.state.directionalShadow,Et.spotLights.value=U.state.spot,Et.spotLightShadows.value=U.state.spotShadow,Et.rectAreaLights.value=U.state.rectArea,Et.ltc_1.value=U.state.rectAreaLTC1,Et.ltc_2.value=U.state.rectAreaLTC2,Et.pointLights.value=U.state.point,Et.pointLightShadows.value=U.state.pointShadow,Et.hemisphereLights.value=U.state.hemi,Et.directionalShadowMap.value=U.state.directionalShadowMap,Et.directionalShadowMatrix.value=U.state.directionalShadowMatrix,Et.spotShadowMap.value=U.state.spotShadowMap,Et.spotLightMatrix.value=U.state.spotLightMatrix,Et.spotLightMap.value=U.state.spotLightMap,Et.pointShadowMap.value=U.state.pointShadowMap,Et.pointShadowMatrix.value=U.state.pointShadowMatrix),B.currentProgram=Ct,B.uniformsList=null,Ct}function Bo(S){if(S.uniformsList===null){const D=S.currentProgram.getUniforms();S.uniformsList=Qs.seqWithValue(D.seq,S.uniforms)}return S.uniformsList}function zo(S,D){const k=Dt.get(S);k.outputColorSpace=D.outputColorSpace,k.batching=D.batching,k.batchingColor=D.batchingColor,k.instancing=D.instancing,k.instancingColor=D.instancingColor,k.instancingMorph=D.instancingMorph,k.skinning=D.skinning,k.morphTargets=D.morphTargets,k.morphNormals=D.morphNormals,k.morphColors=D.morphColors,k.morphTargetsCount=D.morphTargetsCount,k.numClippingPlanes=D.numClippingPlanes,k.numIntersection=D.numClipIntersection,k.vertexAlphas=D.vertexAlphas,k.vertexTangents=D.vertexTangents,k.toneMapping=D.toneMapping}function hh(S,D,k,B,U){D.isScene!==!0&&(D=Wt),C.resetTextureUnits();const it=D.fog,ct=B.isMeshStandardMaterial?D.environment:null,vt=T===null?M.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:Vn,Mt=(B.isMeshStandardMaterial?F:x).get(B.envMap||ct),Tt=B.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Ct=!!k.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Et=!!k.morphAttributes.position,ne=!!k.morphAttributes.normal,de=!!k.morphAttributes.color;let me=zn;B.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(me=M.toneMapping);const He=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,Qt=He!==void 0?He.length:0,bt=Dt.get(B),Te=p.state.lights;if(Y===!0&&(et===!0||S!==z)){const Ke=S===z&&B.id===P;nt.setState(B,S,Ke)}let te=!1;B.version===bt.__version?(bt.needsLights&&bt.lightsStateVersion!==Te.state.version||bt.outputColorSpace!==vt||U.isBatchedMesh&&bt.batching===!1||!U.isBatchedMesh&&bt.batching===!0||U.isBatchedMesh&&bt.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&bt.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&bt.instancing===!1||!U.isInstancedMesh&&bt.instancing===!0||U.isSkinnedMesh&&bt.skinning===!1||!U.isSkinnedMesh&&bt.skinning===!0||U.isInstancedMesh&&bt.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&bt.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&bt.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&bt.instancingMorph===!1&&U.morphTexture!==null||bt.envMap!==Mt||B.fog===!0&&bt.fog!==it||bt.numClippingPlanes!==void 0&&(bt.numClippingPlanes!==nt.numPlanes||bt.numIntersection!==nt.numIntersection)||bt.vertexAlphas!==Tt||bt.vertexTangents!==Ct||bt.morphTargets!==Et||bt.morphNormals!==ne||bt.morphColors!==de||bt.toneMapping!==me||bt.morphTargetsCount!==Qt)&&(te=!0):(te=!0,bt.__version=B.version);let je=bt.currentProgram;te===!0&&(je=ps(B,D,U));let oi=!1,Ge=!1,_r=!1;const ge=je.getUniforms(),Pn=bt.uniforms;if(Rt.useProgram(je.program)&&(oi=!0,Ge=!0,_r=!0),B.id!==P&&(P=B.id,Ge=!0),oi||z!==S){Kt.reverseDepthBuffer?(xt.copy(S.projectionMatrix),td(xt),ed(xt),ge.setValue(I,"projectionMatrix",xt)):ge.setValue(I,"projectionMatrix",S.projectionMatrix),ge.setValue(I,"viewMatrix",S.matrixWorldInverse);const Ke=ge.map.cameraPosition;Ke!==void 0&&Ke.setValue(I,Ft.setFromMatrixPosition(S.matrixWorld)),Kt.logarithmicDepthBuffer&&ge.setValue(I,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&ge.setValue(I,"isOrthographic",S.isOrthographicCamera===!0),z!==S&&(z=S,Ge=!0,_r=!0)}if(U.isSkinnedMesh){ge.setOptional(I,U,"bindMatrix"),ge.setOptional(I,U,"bindMatrixInverse");const Ke=U.skeleton;Ke&&(Ke.boneTexture===null&&Ke.computeBoneTexture(),ge.setValue(I,"boneTexture",Ke.boneTexture,C))}U.isBatchedMesh&&(ge.setOptional(I,U,"batchingTexture"),ge.setValue(I,"batchingTexture",U._matricesTexture,C),ge.setOptional(I,U,"batchingIdTexture"),ge.setValue(I,"batchingIdTexture",U._indirectTexture,C),ge.setOptional(I,U,"batchingColorTexture"),U._colorsTexture!==null&&ge.setValue(I,"batchingColorTexture",U._colorsTexture,C));const vr=k.morphAttributes;if((vr.position!==void 0||vr.normal!==void 0||vr.color!==void 0)&&It.update(U,k,je),(Ge||bt.receiveShadow!==U.receiveShadow)&&(bt.receiveShadow=U.receiveShadow,ge.setValue(I,"receiveShadow",U.receiveShadow)),B.isMeshGouraudMaterial&&B.envMap!==null&&(Pn.envMap.value=Mt,Pn.flipEnvMap.value=Mt.isCubeTexture&&Mt.isRenderTargetTexture===!1?-1:1),B.isMeshStandardMaterial&&B.envMap===null&&D.environment!==null&&(Pn.envMapIntensity.value=D.environmentIntensity),Ge&&(ge.setValue(I,"toneMappingExposure",M.toneMappingExposure),bt.needsLights&&dh(Pn,_r),it&&B.fog===!0&&at.refreshFogUniforms(Pn,it),at.refreshMaterialUniforms(Pn,B,J,G,p.state.transmissionRenderTarget[S.id]),Qs.upload(I,Bo(bt),Pn,C)),B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(Qs.upload(I,Bo(bt),Pn,C),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&ge.setValue(I,"center",U.center),ge.setValue(I,"modelViewMatrix",U.modelViewMatrix),ge.setValue(I,"normalMatrix",U.normalMatrix),ge.setValue(I,"modelMatrix",U.matrixWorld),B.isShaderMaterial||B.isRawShaderMaterial){const Ke=B.uniformsGroups;for(let xr=0,fh=Ke.length;xr<fh;xr++){const Ho=Ke[xr];L.update(Ho,je),L.bind(Ho,je)}}return je}function dh(S,D){S.ambientLightColor.needsUpdate=D,S.lightProbe.needsUpdate=D,S.directionalLights.needsUpdate=D,S.directionalLightShadows.needsUpdate=D,S.pointLights.needsUpdate=D,S.pointLightShadows.needsUpdate=D,S.spotLights.needsUpdate=D,S.spotLightShadows.needsUpdate=D,S.rectAreaLights.needsUpdate=D,S.hemisphereLights.needsUpdate=D}function uh(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(S,D,k){Dt.get(S.texture).__webglTexture=D,Dt.get(S.depthTexture).__webglTexture=k;const B=Dt.get(S);B.__hasExternalTextures=!0,B.__autoAllocateDepthBuffer=k===void 0,B.__autoAllocateDepthBuffer||zt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),B.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(S,D){const k=Dt.get(S);k.__webglFramebuffer=D,k.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(S,D=0,k=0){T=S,R=D,A=k;let B=!0,U=null,it=!1,ct=!1;if(S){const Mt=Dt.get(S);if(Mt.__useDefaultFramebuffer!==void 0)Rt.bindFramebuffer(I.FRAMEBUFFER,null),B=!1;else if(Mt.__webglFramebuffer===void 0)C.setupRenderTarget(S);else if(Mt.__hasExternalTextures)C.rebindTextures(S,Dt.get(S.texture).__webglTexture,Dt.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){const Et=S.depthTexture;if(Mt.__boundDepthTexture!==Et){if(Et!==null&&Dt.has(Et)&&(S.width!==Et.image.width||S.height!==Et.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(S)}}const Tt=S.texture;(Tt.isData3DTexture||Tt.isDataArrayTexture||Tt.isCompressedArrayTexture)&&(ct=!0);const Ct=Dt.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Ct[D])?U=Ct[D][k]:U=Ct[D],it=!0):S.samples>0&&C.useMultisampledRTT(S)===!1?U=Dt.get(S).__webglMultisampledFramebuffer:Array.isArray(Ct)?U=Ct[k]:U=Ct,_.copy(S.viewport),E.copy(S.scissor),O=S.scissorTest}else _.copy(ft).multiplyScalar(J).floor(),E.copy(yt).multiplyScalar(J).floor(),O=Zt;if(Rt.bindFramebuffer(I.FRAMEBUFFER,U)&&B&&Rt.drawBuffers(S,U),Rt.viewport(_),Rt.scissor(E),Rt.setScissorTest(O),it){const Mt=Dt.get(S.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+D,Mt.__webglTexture,k)}else if(ct){const Mt=Dt.get(S.texture),Tt=D||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Mt.__webglTexture,k||0,Tt)}P=-1},this.readRenderTargetPixels=function(S,D,k,B,U,it,ct){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let vt=Dt.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ct!==void 0&&(vt=vt[ct]),vt){Rt.bindFramebuffer(I.FRAMEBUFFER,vt);try{const Mt=S.texture,Tt=Mt.format,Ct=Mt.type;if(!Kt.textureFormatReadable(Tt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Kt.textureTypeReadable(Ct)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=S.width-B&&k>=0&&k<=S.height-U&&I.readPixels(D,k,B,U,Ot.convert(Tt),Ot.convert(Ct),it)}finally{const Mt=T!==null?Dt.get(T).__webglFramebuffer:null;Rt.bindFramebuffer(I.FRAMEBUFFER,Mt)}}},this.readRenderTargetPixelsAsync=async function(S,D,k,B,U,it,ct){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let vt=Dt.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&ct!==void 0&&(vt=vt[ct]),vt){const Mt=S.texture,Tt=Mt.format,Ct=Mt.type;if(!Kt.textureFormatReadable(Tt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Kt.textureTypeReadable(Ct))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(D>=0&&D<=S.width-B&&k>=0&&k<=S.height-U){Rt.bindFramebuffer(I.FRAMEBUFFER,vt);const Et=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,Et),I.bufferData(I.PIXEL_PACK_BUFFER,it.byteLength,I.STREAM_READ),I.readPixels(D,k,B,U,Ot.convert(Tt),Ot.convert(Ct),0);const ne=T!==null?Dt.get(T).__webglFramebuffer:null;Rt.bindFramebuffer(I.FRAMEBUFFER,ne);const de=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Qh(I,de,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,Et),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,it),I.deleteBuffer(Et),I.deleteSync(de),it}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(S,D=null,k=0){S.isTexture!==!0&&(Js("WebGLRenderer: copyFramebufferToTexture function signature has changed."),D=arguments[0]||null,S=arguments[1]);const B=Math.pow(2,-k),U=Math.floor(S.image.width*B),it=Math.floor(S.image.height*B),ct=D!==null?D.x:0,vt=D!==null?D.y:0;C.setTexture2D(S,0),I.copyTexSubImage2D(I.TEXTURE_2D,k,0,0,ct,vt,U,it),Rt.unbindTexture()},this.copyTextureToTexture=function(S,D,k=null,B=null,U=0){S.isTexture!==!0&&(Js("WebGLRenderer: copyTextureToTexture function signature has changed."),B=arguments[0]||null,S=arguments[1],D=arguments[2],U=arguments[3]||0,k=null);let it,ct,vt,Mt,Tt,Ct;k!==null?(it=k.max.x-k.min.x,ct=k.max.y-k.min.y,vt=k.min.x,Mt=k.min.y):(it=S.image.width,ct=S.image.height,vt=0,Mt=0),B!==null?(Tt=B.x,Ct=B.y):(Tt=0,Ct=0);const Et=Ot.convert(D.format),ne=Ot.convert(D.type);C.setTexture2D(D,0),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,D.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,D.unpackAlignment);const de=I.getParameter(I.UNPACK_ROW_LENGTH),me=I.getParameter(I.UNPACK_IMAGE_HEIGHT),He=I.getParameter(I.UNPACK_SKIP_PIXELS),Qt=I.getParameter(I.UNPACK_SKIP_ROWS),bt=I.getParameter(I.UNPACK_SKIP_IMAGES),Te=S.isCompressedTexture?S.mipmaps[U]:S.image;I.pixelStorei(I.UNPACK_ROW_LENGTH,Te.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,Te.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,vt),I.pixelStorei(I.UNPACK_SKIP_ROWS,Mt),S.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,U,Tt,Ct,it,ct,Et,ne,Te.data):S.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,U,Tt,Ct,Te.width,Te.height,Et,Te.data):I.texSubImage2D(I.TEXTURE_2D,U,Tt,Ct,it,ct,Et,ne,Te),I.pixelStorei(I.UNPACK_ROW_LENGTH,de),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,me),I.pixelStorei(I.UNPACK_SKIP_PIXELS,He),I.pixelStorei(I.UNPACK_SKIP_ROWS,Qt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,bt),U===0&&D.generateMipmaps&&I.generateMipmap(I.TEXTURE_2D),Rt.unbindTexture()},this.copyTextureToTexture3D=function(S,D,k=null,B=null,U=0){S.isTexture!==!0&&(Js("WebGLRenderer: copyTextureToTexture3D function signature has changed."),k=arguments[0]||null,B=arguments[1]||null,S=arguments[2],D=arguments[3],U=arguments[4]||0);let it,ct,vt,Mt,Tt,Ct,Et,ne,de;const me=S.isCompressedTexture?S.mipmaps[U]:S.image;k!==null?(it=k.max.x-k.min.x,ct=k.max.y-k.min.y,vt=k.max.z-k.min.z,Mt=k.min.x,Tt=k.min.y,Ct=k.min.z):(it=me.width,ct=me.height,vt=me.depth,Mt=0,Tt=0,Ct=0),B!==null?(Et=B.x,ne=B.y,de=B.z):(Et=0,ne=0,de=0);const He=Ot.convert(D.format),Qt=Ot.convert(D.type);let bt;if(D.isData3DTexture)C.setTexture3D(D,0),bt=I.TEXTURE_3D;else if(D.isDataArrayTexture||D.isCompressedArrayTexture)C.setTexture2DArray(D,0),bt=I.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,D.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,D.unpackAlignment);const Te=I.getParameter(I.UNPACK_ROW_LENGTH),te=I.getParameter(I.UNPACK_IMAGE_HEIGHT),je=I.getParameter(I.UNPACK_SKIP_PIXELS),oi=I.getParameter(I.UNPACK_SKIP_ROWS),Ge=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,me.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,me.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Mt),I.pixelStorei(I.UNPACK_SKIP_ROWS,Tt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ct),S.isDataTexture||S.isData3DTexture?I.texSubImage3D(bt,U,Et,ne,de,it,ct,vt,He,Qt,me.data):D.isCompressedArrayTexture?I.compressedTexSubImage3D(bt,U,Et,ne,de,it,ct,vt,He,me.data):I.texSubImage3D(bt,U,Et,ne,de,it,ct,vt,He,Qt,me),I.pixelStorei(I.UNPACK_ROW_LENGTH,Te),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,te),I.pixelStorei(I.UNPACK_SKIP_PIXELS,je),I.pixelStorei(I.UNPACK_SKIP_ROWS,oi),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Ge),U===0&&D.generateMipmaps&&I.generateMipmap(bt),Rt.unbindTexture()},this.initRenderTarget=function(S){Dt.get(S).__webglFramebuffer===void 0&&C.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?C.setTextureCube(S,0):S.isData3DTexture?C.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?C.setTexture2DArray(S,0):C.setTexture2D(S,0),Rt.unbindTexture()},this.resetState=function(){R=0,A=0,T=null,Rt.reset(),le.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===fo?"display-p3":"srgb",e.unpackColorSpace=Jt.workingColorSpace===hr?"display-p3":"srgb"}}class fr{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new ot(t),this.near=e,this.far=n}clone(){return new fr(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class vo extends ye{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new pn,this.environmentIntensity=1,this.environmentRotation=new pn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class ug extends Pe{constructor(t=null,e=1,n=1,s,r,a,o,l,c=ke,h=ke,d,u){super(null,a,o,l,c,h,s,r,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ul extends Be{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Si=new Vt,Nl=new Vt,Fs=[],Fl=new fn,fg=new Vt,Zi=new Nt,ji=new ai;class tr extends Nt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ul(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,fg)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new fn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Si),Fl.copy(t.boundingBox).applyMatrix4(Si),this.boundingBox.union(Fl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new ai),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Si),ji.copy(t.boundingSphere).applyMatrix4(Si),this.boundingSphere.union(ji)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(Zi.geometry=this.geometry,Zi.material=this.material,Zi.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ji.copy(this.boundingSphere),ji.applyMatrix4(n),t.ray.intersectsSphere(ji)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Si),Nl.multiplyMatrices(n,Si),Zi.matrixWorld=Nl,Zi.raycast(t,Fs);for(let a=0,o=Fs.length;a<o;a++){const l=Fs[a];l.instanceId=r,l.object=this,e.push(l)}Fs.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new Ul(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ug(new Float32Array(s*this.count),s,this.count,lo,dn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class xo extends Wn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ot(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const ar=new w,or=new w,Ol=new Vt,Ji=new ds,Os=new ai,Zr=new w,kl=new w;class pg extends ye{constructor(t=new Se,e=new xo){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)ar.fromBufferAttribute(e,s-1),or.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=ar.distanceTo(or);t.setAttribute("lineDistance",new oe(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Os.copy(n.boundingSphere),Os.applyMatrix4(s),Os.radius+=r,t.ray.intersectsSphere(Os)===!1)return;Ol.copy(s).invert(),Ji.copy(t.ray).applyMatrix4(Ol);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const m=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let v=m,p=g-1;v<p;v+=c){const f=h.getX(v),y=h.getX(v+1),M=ks(this,t,Ji,l,f,y);M&&e.push(M)}if(this.isLineLoop){const v=h.getX(g-1),p=h.getX(m),f=ks(this,t,Ji,l,v,p);f&&e.push(f)}}else{const m=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let v=m,p=g-1;v<p;v+=c){const f=ks(this,t,Ji,l,v,v+1);f&&e.push(f)}if(this.isLineLoop){const v=ks(this,t,Ji,l,g-1,m);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ks(i,t,e,n,s,r){const a=i.geometry.attributes.position;if(ar.fromBufferAttribute(a,s),or.fromBufferAttribute(a,r),e.distanceSqToSegment(ar,or,Zr,kl)>n)return;Zr.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Zr);if(!(l<t.near||l>t.far))return{distance:l,point:kl.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}const Bl=new w,zl=new w;class qc extends pg{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Bl.fromBufferAttribute(e,s),zl.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Bl.distanceTo(zl);t.setAttribute("lineDistance",new oe(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class qa extends Wn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ot(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Hl=new Vt,Za=new ds,Bs=new ai,zs=new w;class Gl extends ye{constructor(t=new Se,e=new qa){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Bs.copy(n.boundingSphere),Bs.applyMatrix4(s),Bs.radius+=r,t.ray.intersectsSphere(Bs)===!1)return;Hl.copy(s).invert(),Za.copy(t.ray).applyMatrix4(Hl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const u=Math.max(0,a.start),m=Math.min(c.count,a.start+a.count);for(let g=u,v=m;g<v;g++){const p=c.getX(g);zs.fromBufferAttribute(d,p),Vl(zs,p,l,s,t,e,this)}}else{const u=Math.max(0,a.start),m=Math.min(d.count,a.start+a.count);for(let g=u,v=m;g<v;g++)zs.fromBufferAttribute(d,g),Vl(zs,g,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Vl(i,t,e,n,s,r,a){const o=Za.distanceSqToPoint(i);if(o<e){const l=new w;Za.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class Mo extends Pe{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class gn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);const h=n[s],u=n[s+1]-h,m=(a-h)/u;return(s+m)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const a=this.getPoint(s),o=this.getPoint(r),l=e||(a.isVector2?new tt:new w);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new w,s=[],r=[],a=[],o=new w,l=new Vt;for(let m=0;m<=t;m++){const g=m/t;s[m]=this.getTangentAt(g,new w)}r[0]=new w,a[0]=new w;let c=Number.MAX_VALUE;const h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let m=1;m<=t;m++){if(r[m]=r[m-1].clone(),a[m]=a[m-1].clone(),o.crossVectors(s[m-1],s[m]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Me(s[m-1].dot(s[m]),-1,1));r[m].applyMatrix4(l.makeRotationAxis(o,g))}a[m].crossVectors(s[m],r[m])}if(e===!0){let m=Math.acos(Me(r[0].dot(r[t]),-1,1));m/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(m=-m);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],m*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class yo extends gn{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new tt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);const o=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,m=c-this.aY;l=u*h-m*d+this.aX,c=u*d+m*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class mg extends yo{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function So(){let i=0,t=0,e=0,n=0;function s(r,a,o,l){i=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let u=(a-r)/c-(o-r)/(c+h)+(o-a)/h,m=(o-a)/h-(l-a)/(h+d)+(l-o)/d;u*=h,m*=h,s(a,o,u,m)},calc:function(r){const a=r*r,o=a*r;return i+t*r+e*a+n*o}}}const Hs=new w,jr=new So,Jr=new So,Qr=new So;class ja extends gn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new w){const n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(Hs.subVectors(s[0],s[1]).add(s[0]),c=Hs);const d=s[o%r],u=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(Hs.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Hs),this.curveType==="centripetal"||this.curveType==="chordal"){const m=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(d),m),v=Math.pow(d.distanceToSquared(u),m),p=Math.pow(u.distanceToSquared(h),m);v<1e-4&&(v=1),g<1e-4&&(g=v),p<1e-4&&(p=v),jr.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,v,p),Jr.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,v,p),Qr.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,v,p)}else this.curveType==="catmullrom"&&(jr.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),Jr.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),Qr.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return n.set(jr.calc(l),Jr.calc(l),Qr.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new w().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Wl(i,t,e,n,s){const r=(n-t)*.5,a=(s-e)*.5,o=i*i,l=i*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*i+e}function gg(i,t){const e=1-i;return e*e*t}function _g(i,t){return 2*(1-i)*i*t}function vg(i,t){return i*i*t}function is(i,t,e,n){return gg(i,t)+_g(i,e)+vg(i,n)}function xg(i,t){const e=1-i;return e*e*e*t}function Mg(i,t){const e=1-i;return 3*e*e*i*t}function yg(i,t){return 3*(1-i)*i*i*t}function Sg(i,t){return i*i*i*t}function ss(i,t,e,n,s){return xg(i,t)+Mg(i,e)+yg(i,n)+Sg(i,s)}class Zc extends gn{constructor(t=new tt,e=new tt,n=new tt,s=new tt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new tt){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ss(t,s.x,r.x,a.x,o.x),ss(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Eg extends gn{constructor(t=new w,e=new w,n=new w,s=new w){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new w){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(ss(t,s.x,r.x,a.x,o.x),ss(t,s.y,r.y,a.y,o.y),ss(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class jc extends gn{constructor(t=new tt,e=new tt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new tt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new tt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class bg extends gn{constructor(t=new w,e=new w){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new w){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new w){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Jc extends gn{constructor(t=new tt,e=new tt,n=new tt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new tt){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(is(t,s.x,r.x,a.x),is(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class wg extends gn{constructor(t=new w,e=new w,n=new w){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new w){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(is(t,s.x,r.x,a.x),is(t,s.y,r.y,a.y),is(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Qc extends gn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new tt){const n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return n.set(Wl(o,l.x,c.x,h.x,d.x),Wl(o,l.y,c.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new tt().fromArray(s))}return this}}var Xl=Object.freeze({__proto__:null,ArcCurve:mg,CatmullRomCurve3:ja,CubicBezierCurve:Zc,CubicBezierCurve3:Eg,EllipseCurve:yo,LineCurve:jc,LineCurve3:bg,QuadraticBezierCurve:Jc,QuadraticBezierCurve3:wg,SplineCurve:Qc});class Tg extends gn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Xl[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Xl[s.type]().fromJSON(s))}return this}}class Ag extends Tg{constructor(t){super(),this.type="Path",this.currentPoint=new tt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new jc(this.currentPoint.clone(),new tt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Jc(this.currentPoint.clone(),new tt(t,e),new tt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){const o=new Zc(this.currentPoint.clone(),new tt(t,e),new tt(n,s),new tt(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Qc(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,s,r,a,o,l),this}absellipse(t,e,n,s,r,a,o,l){const c=new yo(t,e,n,s,r,a,o,l);if(this.curves.length>0){const d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Eo extends Se{constructor(t=[new tt(0,-.5),new tt(.5,0),new tt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=Me(s,0,Math.PI*2);const r=[],a=[],o=[],l=[],c=[],h=1/e,d=new w,u=new tt,m=new w,g=new w,v=new w;let p=0,f=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:p=t[y+1].x-t[y].x,f=t[y+1].y-t[y].y,m.x=f*1,m.y=-p,m.z=f*0,v.copy(m),m.normalize(),l.push(m.x,m.y,m.z);break;case t.length-1:l.push(v.x,v.y,v.z);break;default:p=t[y+1].x-t[y].x,f=t[y+1].y-t[y].y,m.x=f*1,m.y=-p,m.z=f*0,g.copy(m),m.x+=v.x,m.y+=v.y,m.z+=v.z,m.normalize(),l.push(m.x,m.y,m.z),v.copy(g)}for(let y=0;y<=e;y++){const M=n+y*h*s,b=Math.sin(M),R=Math.cos(M);for(let A=0;A<=t.length-1;A++){d.x=t[A].x*b,d.y=t[A].y,d.z=t[A].x*R,a.push(d.x,d.y,d.z),u.x=y/e,u.y=A/(t.length-1),o.push(u.x,u.y);const T=l[3*A+0]*b,P=l[3*A+1],z=l[3*A+0]*R;c.push(T,P,z)}}for(let y=0;y<e;y++)for(let M=0;M<t.length-1;M++){const b=M+y*t.length,R=b,A=b+t.length,T=b+t.length+1,P=b+1;r.push(R,A,P),r.push(T,P,A)}this.setIndex(r),this.setAttribute("position",new oe(a,3)),this.setAttribute("uv",new oe(o,2)),this.setAttribute("normal",new oe(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Eo(t.points,t.segments,t.phiStart,t.phiLength)}}class rs extends Eo{constructor(t=1,e=1,n=4,s=8){const r=new Ag;r.absarc(0,-e/2,t,Math.PI*1.5,0),r.absarc(0,e/2,t,0,Math.PI*.5),super(r.getPoints(n),s),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:s}}static fromJSON(t){return new rs(t.radius,t.length,t.capSegments,t.radialSegments)}}class Xe extends Se{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const h=[],d=[],u=[],m=[];let g=0;const v=[],p=n/2;let f=0;y(),a===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new oe(d,3)),this.setAttribute("normal",new oe(u,3)),this.setAttribute("uv",new oe(m,2));function y(){const b=new w,R=new w;let A=0;const T=(e-t)/n;for(let P=0;P<=r;P++){const z=[],_=P/r,E=_*(e-t)+t;for(let O=0;O<=s;O++){const H=O/s,X=H*l+o,Z=Math.sin(X),G=Math.cos(X);R.x=E*Z,R.y=-_*n+p,R.z=E*G,d.push(R.x,R.y,R.z),b.set(Z,T,G).normalize(),u.push(b.x,b.y,b.z),m.push(H,1-_),z.push(g++)}v.push(z)}for(let P=0;P<s;P++)for(let z=0;z<r;z++){const _=v[z][P],E=v[z+1][P],O=v[z+1][P+1],H=v[z][P+1];t>0&&(h.push(_,E,H),A+=3),e>0&&(h.push(E,O,H),A+=3)}c.addGroup(f,A,0),f+=A}function M(b){const R=g,A=new tt,T=new w;let P=0;const z=b===!0?t:e,_=b===!0?1:-1;for(let O=1;O<=s;O++)d.push(0,p*_,0),u.push(0,_,0),m.push(.5,.5),g++;const E=g;for(let O=0;O<=s;O++){const X=O/s*l+o,Z=Math.cos(X),G=Math.sin(X);T.x=z*G,T.y=p*_,T.z=z*Z,d.push(T.x,T.y,T.z),u.push(0,_,0),A.x=Z*.5+.5,A.y=G*.5*_+.5,m.push(A.x,A.y),g++}for(let O=0;O<s;O++){const H=R+O,X=E+O;b===!0?h.push(X,X+1,H):h.push(X+1,X,H),P+=3}c.addGroup(f,P,b===!0?1:2),f+=P}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xe(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class bo extends Se{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new oe(r,3)),this.setAttribute("normal",new oe(r.slice(),3)),this.setAttribute("uv",new oe(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(y){const M=new w,b=new w,R=new w;for(let A=0;A<e.length;A+=3)m(e[A+0],M),m(e[A+1],b),m(e[A+2],R),l(M,b,R,y)}function l(y,M,b,R){const A=R+1,T=[];for(let P=0;P<=A;P++){T[P]=[];const z=y.clone().lerp(b,P/A),_=M.clone().lerp(b,P/A),E=A-P;for(let O=0;O<=E;O++)O===0&&P===A?T[P][O]=z:T[P][O]=z.clone().lerp(_,O/E)}for(let P=0;P<A;P++)for(let z=0;z<2*(A-P)-1;z++){const _=Math.floor(z/2);z%2===0?(u(T[P][_+1]),u(T[P+1][_]),u(T[P][_])):(u(T[P][_+1]),u(T[P+1][_+1]),u(T[P+1][_]))}}function c(y){const M=new w;for(let b=0;b<r.length;b+=3)M.x=r[b+0],M.y=r[b+1],M.z=r[b+2],M.normalize().multiplyScalar(y),r[b+0]=M.x,r[b+1]=M.y,r[b+2]=M.z}function h(){const y=new w;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];const b=p(y)/2/Math.PI+.5,R=f(y)/Math.PI+.5;a.push(b,1-R)}g(),d()}function d(){for(let y=0;y<a.length;y+=6){const M=a[y+0],b=a[y+2],R=a[y+4],A=Math.max(M,b,R),T=Math.min(M,b,R);A>.9&&T<.1&&(M<.2&&(a[y+0]+=1),b<.2&&(a[y+2]+=1),R<.2&&(a[y+4]+=1))}}function u(y){r.push(y.x,y.y,y.z)}function m(y,M){const b=y*3;M.x=t[b+0],M.y=t[b+1],M.z=t[b+2]}function g(){const y=new w,M=new w,b=new w,R=new w,A=new tt,T=new tt,P=new tt;for(let z=0,_=0;z<r.length;z+=9,_+=6){y.set(r[z+0],r[z+1],r[z+2]),M.set(r[z+3],r[z+4],r[z+5]),b.set(r[z+6],r[z+7],r[z+8]),A.set(a[_+0],a[_+1]),T.set(a[_+2],a[_+3]),P.set(a[_+4],a[_+5]),R.copy(y).add(M).add(b).divideScalar(3);const E=p(R);v(A,_+0,y,E),v(T,_+2,M,E),v(P,_+4,b,E)}}function v(y,M,b,R){R<0&&y.x===1&&(a[M]=y.x-1),b.x===0&&b.z===0&&(a[M]=R/2/Math.PI+.5)}function p(y){return Math.atan2(y.z,-y.x)}function f(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new bo(t.vertices,t.indices,t.radius,t.details)}}const Gs=new w,Vs=new w,ta=new w,Ws=new qe;class Cg extends Se{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){const s=Math.pow(10,4),r=Math.cos(ns*e),a=t.getIndex(),o=t.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],d=new Array(3),u={},m=[];for(let g=0;g<l;g+=3){a?(c[0]=a.getX(g),c[1]=a.getX(g+1),c[2]=a.getX(g+2)):(c[0]=g,c[1]=g+1,c[2]=g+2);const{a:v,b:p,c:f}=Ws;if(v.fromBufferAttribute(o,c[0]),p.fromBufferAttribute(o,c[1]),f.fromBufferAttribute(o,c[2]),Ws.getNormal(ta),d[0]=`${Math.round(v.x*s)},${Math.round(v.y*s)},${Math.round(v.z*s)}`,d[1]=`${Math.round(p.x*s)},${Math.round(p.y*s)},${Math.round(p.z*s)}`,d[2]=`${Math.round(f.x*s)},${Math.round(f.y*s)},${Math.round(f.z*s)}`,!(d[0]===d[1]||d[1]===d[2]||d[2]===d[0]))for(let y=0;y<3;y++){const M=(y+1)%3,b=d[y],R=d[M],A=Ws[h[y]],T=Ws[h[M]],P=`${b}_${R}`,z=`${R}_${b}`;z in u&&u[z]?(ta.dot(u[z].normal)<=r&&(m.push(A.x,A.y,A.z),m.push(T.x,T.y,T.z)),u[z]=null):P in u||(u[P]={index0:c[y],index1:c[M],normal:ta.clone()})}}for(const g in u)if(u[g]){const{index0:v,index1:p}=u[g];Gs.fromBufferAttribute(o,v),Vs.fromBufferAttribute(o,p),m.push(Gs.x,Gs.y,Gs.z),m.push(Vs.x,Vs.y,Vs.z)}this.setAttribute("position",new oe(m,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}}class wo extends bo{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new wo(t.radius,t.detail)}}class To extends Se{constructor(t=.5,e=1,n=32,s=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:a},n=Math.max(3,n),s=Math.max(1,s);const o=[],l=[],c=[],h=[];let d=t;const u=(e-t)/s,m=new w,g=new tt;for(let v=0;v<=s;v++){for(let p=0;p<=n;p++){const f=r+p/n*a;m.x=d*Math.cos(f),m.y=d*Math.sin(f),l.push(m.x,m.y,m.z),c.push(0,0,1),g.x=(m.x/e+1)/2,g.y=(m.y/e+1)/2,h.push(g.x,g.y)}d+=u}for(let v=0;v<s;v++){const p=v*(n+1);for(let f=0;f<n;f++){const y=f+p,M=y,b=y+n+1,R=y+n+2,A=y+1;o.push(M,b,A),o.push(b,R,A)}}this.setIndex(o),this.setAttribute("position",new oe(l,3)),this.setAttribute("normal",new oe(c,3)),this.setAttribute("uv",new oe(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new To(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class pr extends Se{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],d=new w,u=new w,m=[],g=[],v=[],p=[];for(let f=0;f<=n;f++){const y=[],M=f/n;let b=0;f===0&&a===0?b=.5/e:f===n&&l===Math.PI&&(b=-.5/e);for(let R=0;R<=e;R++){const A=R/e;d.x=-t*Math.cos(s+A*r)*Math.sin(a+M*o),d.y=t*Math.cos(a+M*o),d.z=t*Math.sin(s+A*r)*Math.sin(a+M*o),g.push(d.x,d.y,d.z),u.copy(d).normalize(),v.push(u.x,u.y,u.z),p.push(A+b,1-M),y.push(c++)}h.push(y)}for(let f=0;f<n;f++)for(let y=0;y<e;y++){const M=h[f][y+1],b=h[f][y],R=h[f+1][y],A=h[f+1][y+1];(f!==0||a>0)&&m.push(M,b,A),(f!==n-1||l<Math.PI)&&m.push(b,R,A)}this.setIndex(m),this.setAttribute("position",new oe(g,3)),this.setAttribute("normal",new oe(v,3)),this.setAttribute("uv",new oe(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pr(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Rg extends Re{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class ue extends Wn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new ot(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ot(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Lc,this.normalScale=new tt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new pn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class ea extends ue{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new tt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Me(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ot(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ot(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ot(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class mr extends ye{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ot(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Pg extends mr{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ot(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const na=new Vt,Yl=new w,Kl=new w;class th{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new tt(512,512),this.map=null,this.mapPass=null,this.matrix=new Vt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new mo,this._frameExtents=new tt(1,1),this._viewportCount=1,this._viewports=[new ae(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Yl.setFromMatrixPosition(t.matrixWorld),e.position.copy(Yl),Kl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Kl),e.updateMatrixWorld(),na.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(na),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(na)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const $l=new Vt,Qi=new w,ia=new w;class Ig extends th{constructor(){super(new Ye(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new tt(4,2),this._viewportCount=6,this._viewports=[new ae(2,1,1,1),new ae(0,1,1,1),new ae(3,1,1,1),new ae(1,1,1,1),new ae(3,0,1,1),new ae(1,0,1,1)],this._cubeDirections=[new w(1,0,0),new w(-1,0,0),new w(0,0,1),new w(0,0,-1),new w(0,1,0),new w(0,-1,0)],this._cubeUps=[new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,1,0),new w(0,0,1),new w(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Qi.setFromMatrixPosition(t.matrixWorld),n.position.copy(Qi),ia.copy(n.position),ia.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(ia),n.updateMatrixWorld(),s.makeTranslation(-Qi.x,-Qi.y,-Qi.z),$l.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix($l)}}class eh extends mr{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Ig}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class Lg extends th{constructor(){super(new go(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Dg extends mr{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.target=new ye,this.shadow=new Lg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Ug extends mr{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}class nh{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=ql(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=ql();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function ql(){return performance.now()}const Zl=new Vt;class Ng{constructor(t,e,n=0,s=1/0){this.ray=new ds(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new po,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Zl.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Zl),this}intersectObject(t,e=!0,n=[]){return Ja(t,this,n,e),n.sort(jl),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)Ja(t[s],this,n,e);return n.sort(jl),n}}function jl(i,t){return i.distance-t.distance}function Ja(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)Ja(r[a],t,e,!0)}}class Jl{constructor(t=1,e=0,n=0){return this.radius=t,this.phi=e,this.theta=n,this}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Me(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}class Fg extends qc{constructor(t,e=16776960){const n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),s=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],r=new Se;r.setIndex(new Be(n,1)),r.setAttribute("position",new oe(s,3)),super(r,new xo({color:e,toneMapped:!1})),this.box=t,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(t){const e=this.box;e.isEmpty()||(e.getCenter(this.position),e.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(t))}dispose(){this.geometry.dispose(),this.material.dispose()}}class Og extends ri{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:io}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=io);const ih={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class Hi{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const kg=new go(-1,1,1,-1,0,1);class Bg extends Se{constructor(){super(),this.setAttribute("position",new oe([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new oe([0,2,0,0,2,0],2))}}const zg=new Bg;class Ao{constructor(t){this._mesh=new Nt(zg,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,kg)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}}class Hg extends Hi{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof Re?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=os.clone(t.uniforms),this.material=new Re({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new Ao(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class Ql extends Hi{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){const s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,a,4294967295),r.buffers.stencil.setClear(o),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}}class Gg extends Hi{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}}class Vg{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){const n=t.getSize(new tt);this._width=n.width,this._height=n.height,e=new ln(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Tn}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Hg(ih),this.copyPass.material.blending=wn,this.clock=new nh}swapBuffers(){const t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){const e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());const e=this.renderer.getRenderTarget();let n=!1;for(let s=0,r=this.passes.length;s<r;s++){const a=this.passes[s];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),a.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}Ql!==void 0&&(a instanceof Ql?n=!0:a instanceof Gg&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){const e=this.renderer.getSize(new tt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;const n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Wg extends Hi{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new ot}render(t,e,n){const s=t.autoClear;t.autoClear=!1;let r,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),t.autoClear=s}}const Xg={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new ot(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class Oi extends Hi{constructor(t,e,n,s){super(),this.strength=e!==void 0?e:1,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new tt(t.x,t.y):new tt(256,256),this.clearColor=new ot(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new ln(r,a,{type:Tn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let d=0;d<this.nMips;d++){const u=new ln(r,a,{type:Tn});u.texture.name="UnrealBloomPass.h"+d,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const m=new ln(r,a,{type:Tn});m.texture.name="UnrealBloomPass.v"+d,m.texture.generateMipmaps=!1,this.renderTargetsVertical.push(m),r=Math.round(r/2),a=Math.round(a/2)}const o=Xg;this.highPassUniforms=os.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Re({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let d=0;d<this.nMips;d++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[d])),this.separableBlurMaterials[d].uniforms.invSize.value=new tt(1/r,1/a),r=Math.round(r/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new w(1,1,1),new w(1,1,1),new w(1,1,1),new w(1,1,1),new w(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const h=ih;this.copyUniforms=os.clone(h.uniforms),this.blendMaterial=new Re({uniforms:this.copyUniforms,vertexShader:h.vertexShader,fragmentShader:h.fragmentShader,blending:oa,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new ot,this.oldClearAlpha=1,this.basic=new dr,this.fsQuad=new Ao(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new tt(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();const a=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=Oi.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Oi.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this.fsQuad.render(t),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(n),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=a}getSeperableBlurMaterial(t){const e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new Re({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new tt(.5,.5)},direction:{value:new tt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new Re({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}Oi.BlurDirectionX=new tt(1,0);Oi.BlurDirectionY=new tt(0,1);const Yg={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class Kg extends Hi{constructor(){super();const t=Yg;this.uniforms=os.clone(t.uniforms),this.material=new Rg({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new Ao(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},Jt.getTransfer(this._outputColorSpace)===ce&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===_c?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===vc?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===xc?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===so?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Mc?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===yc&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const on={width:30,depth:22,slabThickness:.32},Lt=[{id:"B1",index:-1,name:"Bodrum Kat — Otopark & Teknik",shortName:"B1",elevation:-3.2,height:3.2,kind:"basement",apartments:0},{id:"Z",index:0,name:"Zemin Kat — Lobi & Sosyal Alan",shortName:"Z",elevation:0,height:3.6,kind:"ground",apartments:0},{id:"K1",index:1,name:"1. Kat — Daireler",shortName:"K1",elevation:3.6,height:3.1,kind:"typical",apartments:4},{id:"K2",index:2,name:"2. Kat — Daireler",shortName:"K2",elevation:6.7,height:3.1,kind:"typical",apartments:4},{id:"K3",index:3,name:"3. Kat — Daireler",shortName:"K3",elevation:9.8,height:3.1,kind:"typical",apartments:4},{id:"K4",index:4,name:"4. Kat — Daireler",shortName:"K4",elevation:12.9,height:3.1,kind:"typical",apartments:4},{id:"K5",index:5,name:"5. Kat — Çatı Dubleksleri & Teras",shortName:"K5",elevation:16,height:3.4,kind:"penthouse",apartments:2}],Ei=19.4,us={NW:{x:-8,z:-5.5},NE:{x:8,z:-5.5},SW:{x:-8,z:5.5},SE:{x:8,z:5.5}};function $g(){const i=[],t=["NW","NE","SW","SE"];for(let e=1;e<=4;e++)t.forEach((n,s)=>{const r=s%2===0;i.push({id:`K${e}-D${s+1}`,floorId:`K${e}`,no:`${e}${(s+1).toString().padStart(2,"0")}`,type:r?"3+1":"2+1",area:r?142:98,netArea:r?118:81,rooms:r?["Salon","Mutfak","Yatak Odası 1","Yatak Odası 2","Yatak Odası 3","Banyo","Antre","Balkon"]:["Salon","Mutfak","Yatak Odası 1","Yatak Odası 2","Banyo","Antre","Balkon"],quadrant:n,balcony:!0})});return i.push({id:"K5-D1",floorId:"K5",no:"501",type:"4+1 Dubleks",area:248,netArea:205,rooms:["Salon (çift yükseklik)","Mutfak","Yatak Odası 1","Yatak Odası 2","Yatak Odası 3","Yatak Odası 4","Banyo 1","Banyo 2","Antre","Teras"],quadrant:"NW",balcony:!0}),i.push({id:"K5-D2",floorId:"K5",no:"502",type:"4+1 Dubleks",area:248,netArea:205,rooms:["Salon (çift yükseklik)","Mutfak","Yatak Odası 1","Yatak Odası 2","Yatak Odası 3","Yatak Odası 4","Banyo 1","Banyo 2","Antre","Teras"],quadrant:"SE",balcony:!0}),i}const un=$g(),Gt={width:7,depth:6,elevatorA:{x:-1.9,z:.4,w:1.7,d:1.7},elevatorB:{x:1.9,z:.4,w:1.7,d:1.7},stair:{x:0,z:-1.9}},st="K1-D1",tc=[{id:"salon",name:"Salon",x:-3,z:1.4,w:6,d:5.4,height:2.85,area:32.4},{id:"mutfak",name:"Mutfak",x:2.4,z:-2.2,w:4.6,d:3.4,height:2.85,area:15.6},{id:"yatak1",name:"Yatak Odası 1 (Ebeveyn)",x:2.6,z:2.6,w:4.2,d:4.4,height:2.85,area:18.5},{id:"yatak2",name:"Yatak Odası 2",x:-3.4,z:-3.4,w:3.8,d:3.6,height:2.85,area:13.7},{id:"yatak3",name:"Yatak Odası 3",x:.9,z:-4.3,w:2.6,d:2.6,height:2.85,area:6.8},{id:"banyo",name:"Banyo",x:-.8,z:-3.9,w:2.2,d:2.2,height:2.85,area:4.8},{id:"antre",name:"Antre",x:-.4,z:0,w:2.4,d:3,height:2.85,area:7.2},{id:"balkon",name:"Balkon",x:-3,z:4.9,w:5.6,d:1.8,height:2.85,area:10.1}],Co=[{key:"architectural",label:"Mimari",color:"#9fb3c8",note:"Duvar, döşeme, cephe"},{key:"structural",label:"Taşıyıcı Sistem (konsept)",color:"#f0a04b",note:"Kolon–kiriş ızgarası, perde duvar"},{key:"electrical",label:"Elektrik",color:"#f5d547",note:"Kablo güzergâhları, pano"},{key:"water",label:"Temiz Su",color:"#4ea8de",note:"Besleme hatları, kolon"},{key:"waste",label:"Atık Su",color:"#9d8189",note:"Pis su kolonları, tahliye"},{key:"hvac",label:"Havalandırma",color:"#6ee7b7",note:"Kanal şaftı, menfez"},{key:"fire",label:"Yangın Güvenliği (konsept)",color:"#ef476f",note:"Sprinkler, yangın çıkışı"}],Qa=new Map;function ec(i,t,e){return new ue({color:i,roughness:t,metalness:.02,map:e??null,envMapIntensity:.55})}let nc=null,ic=null,sc=null;function qg(){const t=document.createElement("canvas");t.width=t.height=256;const e=t.getContext("2d");e.fillStyle="#b9b6b0",e.fillRect(0,0,256,256);for(let s=0;s<9e3;s++){const r=Math.random()*256,a=Math.random()*256,o=Math.random();e.fillStyle=`rgba(${o>.5?255:60},${o>.5?255:60},${o>.5?255:60},${.03+Math.random()*.05})`,e.fillRect(r,a,1+Math.random()*2,1+Math.random()*2)}e.strokeStyle="rgba(90,88,84,0.12)";for(let s=0;s<14;s++){e.beginPath();let r=Math.random()*256,a=Math.random()*256;e.moveTo(r,a);for(let o=0;o<5;o++)r+=(Math.random()-.5)*40,a+=(Math.random()-.5)*40,e.lineTo(r,a);e.stroke()}const n=new Mo(t);return n.wrapS=n.wrapT=Di,n.repeat.set(2,2),n.anisotropy=4,n}function Zg(){const t=document.createElement("canvas");t.width=t.height=256;const e=t.getContext("2d");e.fillStyle="#3a3c40",e.fillRect(0,0,256,256);for(let s=0;s<14e3;s++){const r=Math.random()*255;e.fillStyle=`rgba(${r},${r},${r},${.04+Math.random()*.08})`,e.fillRect(Math.random()*256,Math.random()*256,1.5,1.5)}const n=new Mo(t);return n.wrapS=n.wrapT=Di,n.repeat.set(12,12),n}function jg(){const t=document.createElement("canvas");t.width=t.height=256;const e=t.getContext("2d");e.fillStyle="#a97c4f",e.fillRect(0,0,256,256);for(let s=0;s<60;s++){e.strokeStyle=`rgba(${80+Math.random()*40},${50+Math.random()*30},${25+Math.random()*20},${.08+Math.random()*.12})`,e.lineWidth=1+Math.random()*2,e.beginPath();const r=Math.random()*256;e.moveTo(0,r);for(let a=0;a<=256;a+=16)e.lineTo(a,r+Math.sin(a*.05+s)*3);e.stroke()}const n=new Mo(t);return n.wrapS=n.wrapT=Di,n.repeat.set(2,2),n}const sh={concrete:()=>(nc??(nc=qg()),ec(14210511,.86,nc)),concreteDark:()=>ec(9144707,.9),plaster:()=>new ue({color:15723234,roughness:.94,metalness:0}),glass:()=>new ea({color:8300220,roughness:.04,metalness:.42,transparent:!0,opacity:.46,envMapIntensity:3,side:nn,clearcoat:1,clearcoatRoughness:.02,reflectivity:1}),glassDark:()=>new ea({color:2898500,roughness:.12,metalness:.35,transparent:!0,opacity:.72,envMapIntensity:1.2,side:nn}),wood:()=>(sc??(sc=jg()),new ue({color:12555368,roughness:.62,metalness:.04,map:sc})),woodDark:()=>new ue({color:5914672,roughness:.55,metalness:.05}),metal:()=>new ue({color:11120051,roughness:.28,metalness:.92,envMapIntensity:1.1}),metalDark:()=>new ue({color:3093304,roughness:.42,metalness:.85}),marble:()=>new ue({color:15328993,roughness:.2,metalness:.06,envMapIntensity:.9}),stone:()=>new ue({color:10130568,roughness:.92,metalness:.02}),fabric:()=>new ue({color:7306120,roughness:.98,metalness:0}),fabricLight:()=>new ue({color:13222840,roughness:.98,metalness:0}),grass:()=>new ue({color:5208639,roughness:1,metalness:0}),asphalt:()=>(ic??(ic=Zg()),new ue({color:5593181,roughness:.95,metalness:.02,map:ic})),foliage:()=>new ue({color:4156212,roughness:.95,metalness:0,flatShading:!0}),foliageDark:()=>new ue({color:2903846,roughness:.95,metalness:0,flatShading:!0}),emissiveWarm:()=>new ue({color:16773590,emissive:16761975,emissiveIntensity:1.6,roughness:.6,metalness:0}),emissiveCool:()=>new ue({color:15267071,emissive:11065599,emissiveIntensity:1.2,roughness:.4,metalness:0}),water:()=>new ea({color:2188671,roughness:.08,metalness:.1,transparent:!0,opacity:.82,envMapIntensity:1.4}),ceramic:()=>new ue({color:16250869,roughness:.18,metalness:.02}),screen:()=>new ue({color:724756,emissive:1784663,emissiveIntensity:.7,roughness:.2,metalness:.4})};function rn(i){let t=Qa.get(i);return t||(t=sh[i](),Qa.set(i,t)),t}function Jg(){return Object.keys(sh).forEach(i=>rn(i)),[...Qa.values()]}function Qg(i){Jg().forEach(t=>{const e=t;"envMap"in e&&(e.envMap=i,e.needsUpdate=!0)})}let t0=0;function Ro(i="obj"){return`${i}-${(++t0).toString(36)}`}const rc=new Map;function e0(i,t,e){const n=`${i.toFixed(3)}|${t.toFixed(3)}|${e.toFixed(3)}`;let s=rc.get(n);return s||(s=new se(i,t,e),rc.set(n,s)),s}const ac=new Map;function n0(i,t,e,n=12){const s=`${i.toFixed(3)}|${t.toFixed(3)}|${e.toFixed(3)}|${n}`;let r=ac.get(s);return r||(r=new Xe(i,t,e,n),ac.set(s,r)),r}function N(i,t,e,n,s={}){const r=new Nt(e0(i,t,e),rn(n)),[a,o,l]=s.pos??[0,0,0];return r.position.set(a,o,l),s.rotY&&(r.rotation.y=s.rotY),s.rotX&&(r.rotation.x=s.rotX),s.rotZ&&(r.rotation.z=s.rotZ),r.castShadow=s.castShadow??!0,r.receiveShadow=s.receiveShadow??!0,r.name=s.name??Ro("box"),r.userData.ctx=s,s.meta&&(r.userData.meta=s.meta),r}function Po(i,t,e,n,s={}){const r=new Nt(n0(i,t,e,s.seg??12),rn(n)),[a,o,l]=s.pos??[0,0,0];return r.position.set(a,o,l),s.rotY&&(r.rotation.y=s.rotY),s.rotX&&(r.rotation.x=s.rotX),s.rotZ&&(r.rotation.z=s.rotZ),r.castShadow=s.castShadow??!0,r.receiveShadow=s.receiveShadow??!0,r.name=s.name??Ro("cyl"),r.userData.ctx=s,s.meta&&(r.userData.meta=s.meta),r}function An(i,t,e,n=.5,s,r){const a=N(n,.06,n,"emissiveWarm",{pos:[i,t,e],floorId:s,roomId:r,castShadow:!1,meta:{kind:"light",id:`light-${s??"x"}-${r??""}-${Math.round(i*10)}-${Math.round(e*10)}`,label:"Aydınlatma Armatürü",floorId:s,info:[["Tip","LED panel / spot"],["Güç (temsili)","12 W"]]}});return a.name="lamp",a}function ls(i,t,e,n,s,r,a,o={}){const l=e-i,c=n-t,h=Math.hypot(l,c),d=Math.atan2(c,l),u=N(h,s,r,a,{...o,pos:[(i+e)/2,s/2,(t+n)/2],rotY:-d,castShadow:o.castShadow??!0,receiveShadow:!0});return u.name=Ro("wall"),u.userData.wallLength=h,u}function rh(i,t,e={}){i.traverse(n=>{if(n.isMesh){n.userData.meta={...t,...n.userData.meta??{}};const s=n.userData.ctx??{};n.userData.ctx={...s,...e,floorId:e.floorId??t.floorId}}})}function i0(i){const t=new pe;return t.name=`floor-${i.id}`,t.position.y=i.elevation,t.userData.floorId=i.id,t.userData.baseY=i.elevation,t.userData.meta={kind:"floor",id:`floor-${i.id}`,label:i.name,floorId:i.id},t}function s0(i,t){const{width:e,depth:n,slabThickness:s}=on,r=N(e+1.2,s,n+1.2,"concrete",{pos:[0,-s/2,0],floorId:t.id,name:`slab-${t.id}`,receiveShadow:!0,meta:{kind:"floor",id:`slab-${t.id}`,label:`${t.shortName} Döşemesi`,floorId:t.id,area:e*n,info:[["Betonarme","C30/37 (temsili)"],["Kalınlık",`${s*100} cm`],["Kat alanı",`${e*n} m²`]]}});r.userData.roomId="slab",i.add(r);const a=.18;for(const[o,l,c,h]of[[0,-11.6,e+1.2,a],[0,n/2+.6,e+1.2,a],[-15.6,0,a,n+1.2],[e/2+.6,0,a,n+1.2]])i.add(N(c,.22,h,"marble",{pos:[o,.02,l],floorId:t.id,name:`band-${t.id}`}))}function r0(i,t){const{width:e,depth:n}=on,s=t.height,r=e/2,a=n/2,o=2.4,l=[{dir:"N",len:e,cx:0,cz:-a,rotY:0},{dir:"S",len:e,cx:0,cz:a,rotY:0},{dir:"W",len:n,cx:-r,cz:0,rotY:Math.PI/2},{dir:"E",len:n,cx:r,cz:0,rotY:Math.PI/2}];for(const h of l){const d=s-.62,u=h.dir==="N"||h.dir==="S",m=(h.len-.3)/2;for(let v=0;v<2;v++){const p=(v===0?-1:1)*m/2,f=u?p:h.cx,y=u?h.cz:p,M=N(m-.35,d,.07,"glass",{pos:[f,.32+d/2,y],rotY:h.rotY,floorId:t.id,castShadow:!1,receiveShadow:!1,name:`facade-${t.id}-${h.dir}${v}`,meta:{kind:"window",id:`window-${t.id}-${h.dir}${v}`,label:`${t.shortName} — ${a0(h.dir)} Cephe Camı ${v+1}`,floorId:t.id,info:[["Panel","Isı yalıtımlı çift cam"],["Doğrama","Alüminyum, anodize"],["Not","Tıklayın: havalandırma modu"]]}});M.userData.facadeSide=h.dir,M.userData.facadeFloor=t.id,i.add(M)}const g=Math.round(h.len/o);for(let v=0;v<=g;v++){const p=(v/g-.5)*(h.len-.2),f=u?p:h.cx,y=u?h.cz:p;i.add(N(.1,s,.1,"metalDark",{pos:[f,s/2,y],floorId:t.id,name:"mullion"}))}}const c=.3;for(const h of l)i.add(N(h.len+.16,c,.34,"marble",{pos:[h.cx,c/2,h.cz],rotY:h.rotY,floorId:t.id,name:"floor-band"}))}function a0(i){return i==="N"?"Kuzey":i==="S"?"Güney":i==="E"?"Doğu":"Batı"}function o0(i,t){const e=t.height,{width:n,depth:s}=on,r=[];for(const a of[-n/2,-8,8,n/2])for(const o of[-s/2,0,s/2])Math.abs(a)<4&&Math.abs(o)<4||r.push([a,o]);for(const[a,o]of r)i.add(N(.42,e,.42,"concreteDark",{pos:[a,e/2,o],floorId:t.id,name:"column",collider:!0,layer:"structural",meta:{kind:"furniture",id:`col-${t.id}-${a}-${o}`,label:"Kolon (konsept)",floorId:t.id,layer:"structural",info:[["Kesit","40 × 40 cm"],["Malzeme","Betonarme C30/37"],["Not","Konsept gösterim"]]}}))}function l0(i,t){const e=un.filter(s=>s.floorId===t.id),n=on.depth/2;for(const s of e){const r=s.quadrant==="NW"||s.quadrant==="NE",a=s.quadrant==="NW"||s.quadrant==="SW",o=5.2,l=1.8,c=a?-7.5:7.5,h=c,d=r?-11.9+.05:n+l/2-.05,u=new pe;u.position.set(h,0,d),u.name=`balcony-${s.id}`,u.add(N(o,.16,l,"stone",{pos:[0,-.08,0],floorId:t.id,name:"balcony-slab"})),u.add(N(o,1,.03,"glass",{pos:[0,.5,r?-l/2+.05:l/2-.05],floorId:t.id,castShadow:!1,name:"balcony-rail"})),u.add(N(o,.06,.08,"metal",{pos:[0,1.02,r?-l/2+.05:l/2-.05],floorId:t.id})),s.id==="K1-D1"&&(u.add(N(.5,.42,.5,"wood",{pos:[-1.6,.2,.25],floorId:t.id})),u.add(N(.5,.42,.5,"wood",{pos:[1.6,.2,.25],floorId:t.id})),u.add(N(.7,.05,.7,"glassDark",{pos:[0,.45,.25],floorId:t.id})),u.add(N(.05,.42,.05,"metal",{pos:[0,.22,.25],floorId:t.id}))),rh(u,{kind:"room",id:`${s.id}-balkon`,label:`${s.no} — Balkon`,floorId:t.id,apartmentId:s.id,area:8.5,info:[["Alan","≈ 8.5 m²"],["Zemin","Doğal taş"],["Korkuluk","Temperli cam"]]},{floorId:t.id,apartmentId:s.id}),i.add(u)}}function c0(i){const{width:t,depth:e}=on,n=t/2,s=e/2,r=Lt.find(a=>a.id==="K5").height;i.add(N(t+1.4,.2,e+1.4,"stone",{pos:[0,r+.1,0],floorId:"K5",meta:{kind:"floor",id:"roof",label:"Teras → çatı",floorId:"K5"}}));for(const[a,o,l,c]of[[t+1.4,.18,0,-s-.6],[t+1.4,.18,0,s+.6],[.18,e+1.4,-n-.6,0],[.18,e+1.4,n+.6,0]])i.add(N(a,1.05,o,"marble",{pos:[l,r+.62,c],floorId:"K5",name:"parapet"})),i.add(N(a+.06,.06,o+.06,"metal",{pos:[l,r+1.16,c],floorId:"K5"}));for(let a=0;a<7;a++)i.add(N(.12,.12,6,"woodDark",{pos:[-3+a*1,r+2.9,6],floorId:"K5"}));i.add(N(7.2,.14,.14,"woodDark",{pos:[0,r+2.9,3.1],floorId:"K5"}))}function h0(i,t){const e="marble";i.add(N(24,.02,2.4,e,{pos:[0,.012,-5.6],floorId:t.id,name:"corridor-n",castShadow:!1,meta:{kind:"room",id:`corridor-${t.id}-N`,label:`${t.shortName} — Koridor (Kuzey)`,floorId:t.id,area:57.6,info:[["Genişlik","2.4 m"],["Kaplama","Mermer"]]}})),i.add(N(24,.02,2.4,e,{pos:[0,.012,5.6],floorId:t.id,name:"corridor-s",castShadow:!1,meta:{kind:"room",id:`corridor-${t.id}-S`,label:`${t.shortName} — Koridor (Güney)`,floorId:t.id,area:57.6,info:[["Genişlik","2.4 m"],["Kaplama","Mermer"]]}})),i.add(N(2.4,.02,11,e,{pos:[-12.5,.012,0],floorId:t.id,name:"corridor-w",castShadow:!1,meta:{kind:"room",id:`corridor-${t.id}-W`,label:`${t.shortName} — Koridor (Batı)`,floorId:t.id,area:26.4,info:[["Genişlik","2.4 m"]]}})),i.add(N(2.4,.02,11,e,{pos:[12.5,.012,0],floorId:t.id,name:"corridor-e",castShadow:!1,meta:{kind:"room",id:`corridor-${t.id}-E`,label:`${t.shortName} — Koridor (Doğu)`,floorId:t.id,area:26.4,info:[["Genişlik","2.4 m"]]}}));for(let s=-4;s<=4;s++)i.add(An(s*2.6,t.height-.15,-5.6,.6,t.id,"corridor")),i.add(An(s*2.6,t.height-.15,5.6,.6,t.id,"corridor"));const n=t.height;for(const s of un.filter(r=>r.floorId===t.id)){const r=us[s.quadrant],a=r.z;i.add(ls(r.x-6.5,a,r.x+6.5,a,n,.16,"plaster",{floorId:t.id,apartmentId:s.id,name:`apt-frontwall-${s.id}`,meta:{kind:"apartment",id:s.id,label:`${s.no} — ${s.type}`,floorId:t.id,apartmentId:s.id,area:s.area}}))}}function d0(i){const t=i0(i);return s0(t,i),o0(t,i),i.kind!=="basement"&&(r0(t,i),l0(t,i),h0(t,i)),{floor:i,group:t,colliders:[]}}function u0(){const i=new pe;return i.name="roof",i.position.y=0,i.userData.floorId="K5",i.userData.baseY=0,c0(i),i}function f0(i){Lt[0];const{width:t,depth:e}=on;i.add(N(t+1.2,.1,e+1.2,"asphalt",{pos:[0,.05,0],floorId:"B1",name:"basement-floor",castShadow:!1,meta:{kind:"floor",id:"B1-slab",label:"Bodrum — Otopark Zemini",floorId:"B1",area:t*e}}));const n=2.5,s=5;for(let o=0;o<2;o++){const l=o===0?-7.2:7.2;for(let c=0;c<5;c++){const h=-12+c*(n+.15);i.add(N(n,.02,.1,"plaster",{pos:[h,.11,l-s/2],floorId:"B1",castShadow:!1,name:"park-line"})),i.add(N(.1,.02,s,"plaster",{pos:[h-n/2,.11,l],floorId:"B1",castShadow:!1,name:"park-line"})),c%2===0&&(i.add(N(1.8,.75,4.3,"metalDark",{pos:[h,.48,l],floorId:"B1",name:"car-body",collider:!0,meta:{kind:"furniture",id:`car-${o}-${c}`,label:"Otopark — Araç",floorId:"B1",info:[["Park yeri","2.5 × 5.0 m"],["Alan",`${n*s} m²`]]}})),i.add(N(1.6,.55,2.2,"glassDark",{pos:[h,1.12,l+.2],floorId:"B1",name:"car-cabin"})))}for(let c=0;c<3;c++){const h=6+c*(n+.15);i.add(N(n,.02,.1,"plaster",{pos:[h,.11,l-s/2],floorId:"B1",castShadow:!1,name:"park-line"}))}}const r=[["Elektrik Odası",-12.5,-9.2,4.5,3.2],["Mekanik (Kazan)",-7.5,-9.2,4.5,3.2],["Su Deposu",12,-9.2,4.5,3.2],["Atık / Çöp Odası",12,9.2,4.5,3.2]];for(const[o,l,c,h,d]of r)i.add(N(h,2.9,.14,"concreteDark",{pos:[l,2.9/2,c-d/2],floorId:"B1",collider:!0})),i.add(N(h,2.9,.14,"concreteDark",{pos:[l,2.9/2,c+d/2],floorId:"B1",collider:!0})),i.add(N(.14,2.9,d,"concreteDark",{pos:[l-h/2,2.9/2,c],floorId:"B1",collider:!0})),i.add(N(.14,2.9,d,"concreteDark",{pos:[l+h/2,2.9/2,c],floorId:"B1",collider:!0})),i.add(N(.9,2.1,.06,"metalDark",{pos:[l,1.05,c+d/2-.02],floorId:"B1",name:`tech-door-${o}`,meta:{kind:"door",id:`tech-${o}`,label:`${o} Kapısı`,floorId:"B1",info:[["Genişlik","90 cm"]]}})),i.add(N(h-1.2,.05,d-.6,"stone",{pos:[l,.06,c],floorId:"B1",castShadow:!1,meta:{kind:"room",id:`tech-${o}`,label:o,floorId:"B1",area:h*d,info:[["Alan",`${(h*d).toFixed(1)} m²`]]}})),i.add(An(l,2.5,c,.5,"B1",o));for(let o=-2;o<=2;o++)i.add(An(o*5.5,2.7,-3.4,.7,"B1","park")),i.add(An(o*5.5,2.7,3.4,.7,"B1","park"));i.add(N(4.4,.1,7,"asphalt",{pos:[-12.5,.12,-12.5],rotX:-.09,floorId:"B1",castShadow:!1,name:"ramp",meta:{kind:"floor",id:"B1-ramp",label:"Otopark Rampası",floorId:"B1",info:[["Eğim","≈ %12 (konsept)"],["Genişlik","4.4 m"]]}}))}function p0(i){const e=Lt[1].height,{width:n,depth:s}=on;i.add(N(n,.03,s,"marble",{pos:[0,.015,0],floorId:"Z",castShadow:!1,name:"lobby-floor",meta:{kind:"room",id:"Z-lobi",label:"Zemin — Lobi",floorId:"Z",area:420,info:[["Zemin","Cilalı mermer"],["Yükseklik",`${e} m`],["Brüt alan","≈ 660 m² (kat)"]]}})),i.add(N(n-1,.14,s-1,"plaster",{pos:[0,e-.09,0],floorId:"Z",name:"lobby-ceiling",meta:{kind:"floor",id:"lobby-ceiling",label:"Lobi Tavanı",floorId:"Z"}}));const r=new pe;r.position.set(-6,0,6.5),r.add(N(4.2,1.05,.75,"marble",{pos:[0,.53,0],floorId:"Z",name:"reception-body"})),r.add(N(4.3,.07,.85,"woodDark",{pos:[0,1.08,0],floorId:"Z"})),r.add(N(3,.9,.06,"glass",{pos:[0,1.55,-.3],floorId:"Z",castShadow:!1})),i.add(r),r.traverse(h=>{const d=h;d.isMesh&&(d.userData.meta={kind:"furniture",id:"Z-resepsiyon",label:"Resepsiyon Bankosu",floorId:"Z",area:3.2,info:[["Ölçü","4.2 × 0.75 m"],["Malzeme","Mermer + ahşap kaplama"]]})}),i.add(N(1.6,1.1,.7,"metalDark",{pos:[5.5,.55,7.2],floorId:"Z",name:"security-desk",meta:{kind:"furniture",id:"Z-guvenlik",label:"Güvenlik Noktası",floorId:"Z",info:[["Ekipman","Kartlı geçiş, kamera monitörü"]]}})),i.add(N(.6,.35,.05,"screen",{pos:[5.5,1.4,7.5],floorId:"Z",rotX:-.2}));const a=new pe;a.position.set(-9,0,-1.5),a.add(N(6,.02,5,"fabricLight",{pos:[0,.02,0],floorId:"Z",castShadow:!1})),a.add(N(3.2,.42,1,"fabric",{pos:[0,.28,-1.6],floorId:"Z"})),a.add(N(3.2,.5,.22,"fabric",{pos:[0,.62,-2],floorId:"Z"})),a.add(N(1,.42,2.2,"fabric",{pos:[-1.9,.28,-.4],floorId:"Z"})),a.add(N(.22,.5,2.2,"fabric",{pos:[-2.3,.62,-.4],floorId:"Z"})),a.add(N(1.6,.06,.9,"wood",{pos:[.2,.4,-.4],floorId:"Z"})),a.add(N(.08,.4,.08,"metal",{pos:[-.5,.2,-.4],floorId:"Z"})),a.add(N(.08,.4,.08,"metal",{pos:[.9,.2,-.4],floorId:"Z"})),i.add(a),a.traverse(h=>{const d=h;d.isMesh&&(d.userData.meta={kind:"room",id:"Z-sosyal",label:"Zemin — Sosyal Alan",floorId:"Z",area:30,info:[["Kullanım","Sakinler salonu"],["Kapasite","≈ 12 kişi"]]})});for(const[h,d]of[[-3.5,7.6],[2.5,7.6],[-12,3],[12,-3]])i.add(N(.7,.75,.7,"ceramic",{pos:[h,.37,d],floorId:"Z",name:"planter"})),i.add(N(1.1,1,1.1,"foliage",{pos:[h,1.35,d],floorId:"Z",name:"plant"}));const o=new pe;o.position.set(0,0,s/2),o.userData.meta={kind:"door",id:"Z-giris-kapisi",label:"Ana Giriş Kapısı (Cam)",floorId:"Z",info:[["Tip","Otomatik kayar kanat"],["Genişlik","2.4 m"],["Durum","Kapalı"]]};const l=N(1.18,2.5,.08,"glass",{pos:[-.6,1.25,0],floorId:"Z",castShadow:!1,name:"entrance-door-L"}),c=N(1.18,2.5,.08,"glass",{pos:[.6,1.25,0],floorId:"Z",castShadow:!1,name:"entrance-door-R"});l.userData.baseX=-.6,c.userData.baseX=.6,o.add(l,c),o.add(N(2.5,.1,.14,"metal",{pos:[0,2.55,0],floorId:"Z"})),i.add(o);for(let h=0;h<3;h++)i.add(N(6,.16,1,"stone",{pos:[0,-.08-h*.16,s/2+.6+h*1],floorId:"Z",name:"entrance-step"}));i.add(N(7,.18,3.2,"marble",{pos:[0,3.3,s/2+1.4],floorId:"Z",name:"canopy"}));for(let h=-2;h<=2;h++)i.add(An(h*1.3,3.18,s/2+1.2,.28,"Z","giris"));for(let h=-3;h<=3;h++)for(let d=-2;d<=2;d++)Math.abs(h)<2&&Math.abs(d)<2||i.add(An(h*3.2,e-.2,d*3.6,.5,"Z","lobi"));for(const h of[Gt.elevatorA.x,Gt.elevatorB.x])i.add(N(.16,.4,.1,"metal",{pos:[h+1.05,1.3,Gt.elevatorA.z+Gt.elevatorA.d/2+.1],floorId:"Z",name:"call-panel",meta:{kind:"elevator",id:`elevator-call-${h<0?"A":"B"}`,label:`Asansör ${h<0?"A":"B"} Çağrı Paneli`,floorId:"Z",info:[["Not","Paneli tıklayıp kat seçin"]]}}))}class m0{constructor(){j(this,"group",new pe);j(this,"cars",[]);j(this,"indicatorMaterial",null);this.group.name="core",this.buildShafts(),this.buildStair(),this.buildLobbyWall(),this.cars.push(this.buildCar("A",Gt.elevatorA.x,Gt.elevatorA.z)),this.cars.push(this.buildCar("B",Gt.elevatorB.x,Gt.elevatorB.z))}floorY(t){const e=Lt.find(n=>n.index===t);return e?e.elevation:0}buildShafts(){const{width:t,elevatorA:e,elevatorB:n}=Gt,s=20.2;this.group.add(N(.16,s,e.d+.3,"concreteDark",{pos:[0,s/2-3.2,e.z],name:"shaft-partition"}));for(const r of[e,n])this.group.add(N(r.w+.32,s,.16,"concreteDark",{pos:[r.x,s/2-3.2,r.z-r.d/2],name:"shaft-back"}));for(const r of Lt)for(const a of[e,n]){const o=N(a.w,r.height-.2,.06,"metalDark",{pos:[a.x,r.elevation+(r.height-.2)/2,a.z+a.d/2+.02],name:`elevator-door-${r.id}`,layer:"electrical",meta:{kind:"elevator",id:`elevator-${a===e?"A":"B"}-${r.id}`,label:`Asansör ${a===e?"A":"B"} — ${r.shortName} kapısı`,floorId:r.id,info:[["Kabin","1.6 × 1.6 m"],["Kapasite","8 kişi / 630 kg"],["Hız","1.6 m/s"]]}});this.group.add(o),this.group.add(N(a.w+.3,.08,.1,"emissiveCool",{pos:[a.x,r.elevation+r.height-.25,a.z+a.d/2+.08],castShadow:!1}))}this.group.add(ls(-t/2,-6/2,t/2,-6/2,3,.18,"plaster",{name:"core-south"}))}buildStair(){for(const t of Lt){if(t.index===5)continue;const e=17,n=t.height/e;for(let r=0;r<e;r++){const a=N(1.55,n,.29,"concrete",{pos:[Gt.stair.x-1,t.elevation+n*(r+.5),Gt.stair.z-.85+r*.28],name:"stair-step",receiveShadow:!0});this.group.add(a)}this.group.add(N(3.4,.18,1.2,"concrete",{pos:[Gt.stair.x,t.elevation+t.height-.09,Gt.stair.z+1.35],name:"landing"}));const s=N(.05,1,4.6,"metal",{pos:[Gt.stair.x-1.85,t.elevation+.9,Gt.stair.z-.3],name:"stair-rail"});this.group.add(s)}for(const t of Lt)this.group.add(N(.9,.26,.05,"emissiveCool",{pos:[Gt.stair.x+2.2,t.elevation+2.4,Gt.stair.z+1.9],castShadow:!1,meta:{kind:"system",id:`fireexit-${t.id}`,label:"Yangın Çıkışı (konsept)",floorId:t.id,layer:"fire",info:[["Levha","Acil çıkış yönlendirmesi"],["Not","Mevzuat uygunluğu doğrulanmamıştır"]]}}))}buildLobbyWall(){const e=Lt[1].height;this.group.add(ls(-7/2,Gt.depth/2,Gt.width/2,Gt.depth/2,e,.2,"plaster",{floorId:"Z",name:"core-lobby-wall"}))}buildCar(t,e,n){const s=new pe;s.name=`elevator-car-${t}`;const r=1.55,a=1.55,o=2.3;s.add(N(r,.08,a,"metal",{pos:[0,.04,0],name:"car-floor"})),s.add(N(r,.08,a,"metal",{pos:[0,o,0],name:"car-ceiling"})),s.add(N(.06,o,a,"metal",{pos:[-r/2,o/2,0],name:"car-left"})),s.add(N(.06,o,a,"metal",{pos:[r/2,o/2,0],name:"car-right"})),s.add(N(r,o,.06,"metalDark",{pos:[0,o/2,-a/2],name:"car-back"})),s.add(N(r*.7,.05,a*.7,"emissiveWarm",{pos:[0,o-.06,0],castShadow:!1}));const l=[];for(let d=0;d<2;d++){const u=N(r/2-.02,o-.12,.05,"metalDark",{pos:[d===0?-r/4:r/4,(o-.12)/2,a/2],name:`car-door-${d}`});u.userData.baseX=u.position.x,l.push(u),s.add(u)}const c=new Nt(new Bi(.4,.16),new dr({color:16752451}));this.indicatorMaterial=this.indicatorMaterial??c.material,c.position.set(0,o-.3,-a/2+.041),c.name="car-indicator",s.add(c);const h=Lt[1].elevation;return s.position.set(e,h,n),this.group.add(s),{id:t,group:s,doors:l,shaftX:e,shaftZ:n,currentY:h,targetY:h,currentFloor:0,doorOpen:0,dir:0,calls:[]}}call(t,e){const n=this.cars.find(s=>s.id===t);n&&(n.calls.includes(e)||n.calls.push(e))}update(t){for(const e of this.cars){if(e.calls.length>0){const o=e.calls[0],l=this.floorY(o);e.targetY=l}e.doors.some(o=>Math.abs(o.position.x-o.userData.baseX)>.01);const n=e.targetY-e.currentY,s=1.6;if(Math.abs(n)<.01){if(e.currentY=e.targetY,e.dir=0,e.calls.length>0){const o=e.calls[0];this.floorY(o)===e.currentY&&(e.doorOpen=Math.min(1,e.doorOpen+t*2.5),e.doorOpen>=.999&&(e.calls.shift(),e.currentFloor=o,e.doorOpen=0))}}else{e.dir=Math.sign(n);const o=Math.min(Math.abs(n),s*t)*e.dir;e.currentY+=o,e.doorOpen=Math.max(0,e.doorOpen-t*2.5)}const a=.62*e.doorOpen;e.doors[0].position.x=e.doors[0].userData.baseX-a,e.doors[1].position.x=e.doors[1].userData.baseX+a,e.group.position.y=e.currentY,this.indicatorMaterial&&this.indicatorMaterial.color.setHex(e.dir!==0?16752451:4906624)}}getCarPosition(t){const e=this.cars.find(n=>n.id===t);return e?new w(e.shaftX,e.currentY+1,e.shaftZ):null}reset(){for(const t of this.cars)t.calls.length=0,t.currentY=t.targetY=this.floorY(0),t.currentFloor=0,t.doorOpen=0,t.dir=0,t.group.position.y=t.currentY,t.doors.forEach(e=>e.position.x=e.userData.baseX)}}const oc=.14;function g0(){const i=new pe,t=un.find(u=>u.id===st),e=us[t.quadrant];i.position.set(e.x,0,e.z),i.name="hero-apartment",i.userData.apartmentId=st,i.userData.floorId="K1";const n=[],s=[],r={salon:"wood",mutfak:"ceramic",yatak1:"wood",yatak2:"wood",yatak3:"wood",banyo:"ceramic",antre:"marble",balkon:"stone"};for(const u of tc){const m=r[u.id]??"wood",g=N(u.w,.04,u.d,m,{pos:[u.x,.02,u.z],floorId:"K1",apartmentId:st,roomId:u.id,castShadow:!1,name:`floor-${u.id}`,meta:{kind:"room",id:`${st}-${u.id}`,label:u.name,floorId:"K1",apartmentId:st,area:u.area,info:[["Alan",`${u.area} m²`],["Tavan yüksekliği",`${u.height} m`],["Ölçü",`${u.w} × ${u.d} m`]]}});i.add(g);const v=N(u.w,.06,u.d,"plaster",{pos:[u.x,u.height-.03,u.z],floorId:"K1",apartmentId:st,roomId:u.id,castShadow:!1,name:`ceiling-${u.id}`});v.userData.isCeiling=!0,i.add(v)}const a=6,o=5.25,l=2.85,c=[[-a,-o,a,-o],[-a,o,a,o],[-a,-o,-a,o],[a,-o,a,o]];for(const[u,m,g,v]of c){const p=ls(u,m,g,v,l,oc,"plaster",{floorId:"K1",apartmentId:st,roomId:"sinir",collider:!0,name:"apt-outer",meta:{kind:"apartment",id:st,label:`${t.no} — ${t.type} (örnek daire)`,floorId:"K1",apartmentId:st,area:t.area}});i.add(p)}[[.6,-.4,.6,4],[1.6,0,1.6,4.9],[1.6,4.4,5.9,4.4],[.6,-2.7,1.4,-2.7],[.6,-2,.6,-4.9],[-1.4,-1.6,-1.4,-4.9],[-2.4,-1.4,.6,-1.4],[.6,-2.9,2.2,-2.9],[-1.4,-2.9,-.9,-2.9],[.9,-3.9,.9,-4.9]].forEach(([u,m,g,v],p)=>{i.add(ls(u,m,g,v,l,oc,"plaster",{floorId:"K1",apartmentId:st,roomId:`wall${p}`,collider:!0,name:`inner-wall-${p}`}))});function d(u,m,g,v,p,f=.9,y,M){const b=new pe;b.position.set(g,0,v),b.rotation.y=p;const R=N(f,2.1,.06,"woodDark",{pos:[f/2,1.05,0],floorId:"K1",apartmentId:st,name:`door-${u}`,meta:{kind:"door",id:u,label:m,floorId:"K1",apartmentId:st,info:[["Genişlik",`${f*100} cm`],["Tür","İç mekân kapısı"]]}});R.userData.doorId=u,b.add(R),b.add(N(.12,.03,.03,"metal",{pos:[f*.82,1,.06],floorId:"K1",apartmentId:st})),i.add(b),n.push({id:u,pivot:b,mesh:R,open:!1,angle:0,targetAngle:0,openAngle:Math.PI*.55,label:m,roomA:y,roomB:M})}d("K1-D1-giris","101 Daire Girişi",-5.9,-.2,Math.PI/2,1,"antre","koridor"),d("K1-D1-salon","Salon Kapısı",-2.3,-1.32,0,.9,"antre","salon"),d("K1-D1-mutfak","Mutfak Kapısı",.62,.4,Math.PI/2,.85,"salon","mutfak"),d("K1-D1-yatak1","Ebeveyn Yatak Odası Kapısı",1.62,1.4,Math.PI/2,.85,"salon","yatak1"),d("K1-D1-yatak2","2. Yatak Odası Kapısı",-1.38,-2.4,Math.PI/2,.8,"antre","yatak2"),d("K1-D1-banyo","Banyo Kapısı",-.9,-2.88,0,.75,"antre","banyo"),d("K1-D1-balkon","Balkon Kapısı (Cam)",-3,4.9,0,1.1,"salon","balkon");for(const u of tc){const m=u.id==="banyo"?1:2,g=[];for(let p=0;p<m;p++){const f=m===1?0:(p===0?-1:1)*u.w*.22,y=An(u.x+f,u.height-.12,u.z,u.id==="balkon"?.3:.55,"K1",u.id);g.push(y),i.add(y)}const v=new eh(16767392,u.id==="balkon"?0:5,Math.max(u.w,u.d)*1.9,1.8);v.position.set(u.x,u.height-.3,u.z),v.castShadow=!1,i.add(v),s.push({id:`K1-D1-light-${u.id}`,room:u.name,floorId:"K1",meshes:g,pointLight:v,on:u.id!=="balkon",powerW:u.id==="balkon"?8:24})}return _0(i),v0(i),x0(i),M0(i),y0(i),{group:i,doors:n,lights:s}}function cs(i,t,e,n,s){i.userData.meta={kind:"furniture",id:t,label:e,floorId:"K1",apartmentId:st,roomId:n,info:s},i.userData.ctx={...i.userData.ctx??{},floorId:"K1",apartmentId:st,roomId:n}}function _0(i){const n=N(4.4,.85,.6,"woodDark",{pos:[2.4,.45,-3.6500000000000004],floorId:"K1",apartmentId:st,roomId:"mutfak",name:"kitchen-lower"});cs(n,"K1-D1-mutfak-alt","Mutfak Alt Dolabı","mutfak",[["Uzunluk","4.4 m"],["Yükseklik","85 cm"]]),i.add(n);const s=N(4.5,.05,.66,"marble",{pos:[2.4,.89,-2.2-1.45],floorId:"K1",apartmentId:st,roomId:"mutfak",name:"kitchen-top"});cs(s,"K1-D1-mutfak-tezgah","Mutfak Tezgâhı (Mermer)","mutfak",[["Malzeme","Kompozit mermer"],["Derinlik","66 cm"]]),i.add(s),i.add(N(4.4,.72,.36,"wood",{pos:[2.4,1.86,-2.2-1.58],floorId:"K1",apartmentId:st,roomId:"mutfak",name:"kitchen-upper"})),i.add(N(.9,.3,.5,"metal",{pos:[2.4,1.62,-2.2-1.35],floorId:"K1",apartmentId:st,roomId:"mutfak"})),i.add(N(.62,.02,.5,"glassDark",{pos:[2.4-.9,.92,-2.2-1.45],floorId:"K1",apartmentId:st,roomId:"mutfak",meta:{kind:"furniture",id:"K1-D1-ocak",label:"Ankastre Ocak",floorId:"K1",apartmentId:st,roomId:"mutfak",info:[["Tip","İndüksiyon, 4 gözlü"]]}})),i.add(N(.7,.16,.42,"metal",{pos:[2.4+1.2,.85,-2.2-1.45],floorId:"K1",apartmentId:st,roomId:"mutfak"})),i.add(N(.75,1.9,.7,"metal",{pos:[2.4+2.4,.95,-2.2-1.4],floorId:"K1",apartmentId:st,roomId:"mutfak",name:"fridge",meta:{kind:"furniture",id:"K1-D1-buzdolabi",label:"Buzdolabı",floorId:"K1",apartmentId:st,roomId:"mutfak",info:[["Hacim","420 L"],["Enerji sınıfı","A+++"]]}})),i.add(N(2,.9,.9,"woodDark",{pos:[2.4-.3,.45,-2.2+.4],floorId:"K1",apartmentId:st,roomId:"mutfak"})),i.add(N(2.1,.06,1,"marble",{pos:[2.4-.3,.93,-2.2+.4],floorId:"K1",apartmentId:st,roomId:"mutfak"}));for(let r=0;r<3;r++)i.add(N(.34,.65,.34,"fabric",{pos:[2.4-1.1+r*.8,.33,-2.2+1.05],floorId:"K1",apartmentId:st,roomId:"mutfak"}));i.add(An(2.4,2.4,-2.2-1.2,.9,"K1","mutfak"))}function v0(i){i.add(N(4.4,.02,3.4,"fabricLight",{pos:[-3,.04,1.4+.3],floorId:"K1",apartmentId:st,roomId:"salon",castShadow:!1,meta:{kind:"furniture",id:"K1-D1-hali",label:"Salon Halısı",floorId:"K1",apartmentId:st,roomId:"salon",info:[["Ölçü","4.4 × 3.4 m"]]}}));const n=N(2.6,.44,.95,"fabric",{pos:[-3,.3,1.4+2],floorId:"K1",apartmentId:st,roomId:"salon",name:"sofa"});cs(n,"K1-D1-koltuk","3'lü Koltuk","salon",[["Ölçü","2.6 × 0.95 m"],["Kumaş","Bukle dokuma"]]),i.add(n),i.add(N(2.6,.55,.22,"fabric",{pos:[-3,.7,1.4+2.42],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.2,.5,.95,"fabric",{pos:[-3-1.4,.55,1.4+2],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.2,.5,.95,"fabric",{pos:[-3+1.4,.55,1.4+2],floorId:"K1",apartmentId:st,roomId:"salon"}));for(const o of[-2.2,2.2])i.add(N(.85,.42,.85,"fabricLight",{pos:[-3+o,.28,1.4-.2],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.85,.5,.16,"fabricLight",{pos:[-3+o,.65,1.4-.6],floorId:"K1",apartmentId:st,roomId:"salon"}));i.add(N(1.5,.06,.85,"wood",{pos:[-3,.4,1.4+.54],floorId:"K1",apartmentId:st,roomId:"salon",name:"coffee-table"})),i.add(N(.06,.38,.06,"metal",{pos:[-3-.6,.2,1.4+.25],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.06,.38,.06,"metal",{pos:[-3+.6,.2,1.4+.25],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(2.6,.5,.45,"woodDark",{pos:[-3,.25,1.4-1.05],floorId:"K1",apartmentId:st,roomId:"salon",name:"tv-unit"}));const s=N(1.7,.96,.05,"screen",{pos:[-3,1.55,1.4-1.12],floorId:"K1",apartmentId:st,roomId:"salon",name:"tv",meta:{kind:"furniture",id:"K1-D1-tv",label:'Televizyon (65")',floorId:"K1",apartmentId:st,roomId:"salon",info:[["Ekran","65 inç 4K"],["Not","Tıklayın: ekran modu"]]}});i.add(s);const r=-1,a=1.4-2.6;i.add(N(1.8,.06,.95,"wood",{pos:[r,.74,a],floorId:"K1",apartmentId:st,roomId:"salon",name:"dining-table"}));for(let o=0;o<4;o++){const l=r-.65+o%2*1.3,c=a-.8+Math.floor(o/2)*1.6;i.add(N(.45,.45,.45,"woodDark",{pos:[l,.22,c],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.45,.5,.07,"woodDark",{pos:[l,.65,c+(o<2?-.19:.19)],floorId:"K1",apartmentId:st,roomId:"salon"}))}i.add(N(1,.7,.04,"fabricLight",{pos:[-3+1.2,1.9,1.4+2.6],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.5,.6,.5,"ceramic",{pos:[-3+2.6,.3,1.4+2.2],floorId:"K1",apartmentId:st,roomId:"salon"})),i.add(N(.9,1.2,.9,"foliage",{pos:[-3+2.6,1.3,1.4+2.2],floorId:"K1",apartmentId:st,roomId:"salon"}))}function x0(i){const n=new pe;n.add(N(1.8,.42,2.1,"woodDark",{pos:[2.6,.24,2.6]})),n.add(N(1.72,.22,2,"fabricLight",{pos:[2.6,.55,2.6]})),n.add(N(1.8,.9,.12,"woodDark",{pos:[2.6,.55,2.6-1.08]})),n.add(N(.7,.16,.42,"ceramic",{pos:[2.6-.42,.72,2.6-.78]})),n.add(N(.7,.16,.42,"ceramic",{pos:[2.6+.42,.72,2.6-.78]})),n.add(N(1.78,.1,1.2,"fabric",{pos:[2.6,.68,2.6+.42]})),i.add(n),n.traverse(c=>{const h=c;h.isMesh&&cs(h,"K1-D1-yatak1","Çift Kişilik Yatak (160 × 200)","yatak1",[["Ölçü","1.8 × 2.1 m"],["Başlık","Ahşap panel"]])});for(const c of[-1.25,1.25])i.add(N(.45,.5,.4,"wood",{pos:[2.6+c,.25,2.6-.85],floorId:"K1",apartmentId:st,roomId:"yatak1"})),i.add(Po(.13,.16,.3,"ceramic",{pos:[2.6+c,.65,2.6-.85],floorId:"K1",apartmentId:st,roomId:"yatak1",seg:10}));i.add(N(.6,2.2,2.6,"woodDark",{pos:[2.6+1.7,1.1,2.6+.4],floorId:"K1",apartmentId:st,roomId:"yatak1",name:"wardrobe",meta:{kind:"furniture",id:"K1-D1-gardirob",label:"Gardırop (4 kapak)",floorId:"K1",apartmentId:st,roomId:"yatak1",info:[["Ölçü","2.6 × 0.6 m"],["Yükseklik","2.2 m"]]}})),i.add(N(1.2,.8,.45,"wood",{pos:[2.6-1,.4,2.6+1.6],floorId:"K1",apartmentId:st,roomId:"yatak1"}));const s=-3.4,r=-3.4,a=new pe;a.add(N(1.4,.4,2,"wood",{pos:[s,.22,r]})),a.add(N(1.34,.2,1.9,"fabricLight",{pos:[s,.52,r]})),a.add(N(1.4,.8,.1,"wood",{pos:[s,.5,r-1.03]})),a.add(N(1.3,.08,1,"fabric",{pos:[s,.64,r+.4]})),i.add(a),a.traverse(c=>{const h=c;h.isMesh&&cs(h,"K1-D1-yatak2","Tek Kişilik Yatak (140 × 200)","yatak2",[["Ölçü","1.4 × 2.0 m"]])}),i.add(N(.5,1.9,1.6,"woodDark",{pos:[s-1.5,.95,r+.2],floorId:"K1",apartmentId:st,roomId:"yatak2"})),i.add(N(1.2,.05,.6,"wood",{pos:[s+1.4,.74,r+1.2],floorId:"K1",apartmentId:st,roomId:"yatak2"})),i.add(N(.42,.45,.42,"fabric",{pos:[s+1.4,.22,r+1.65],floorId:"K1",apartmentId:st,roomId:"yatak2"}));const o=.9,l=-4.3;i.add(N(1,.38,1.9,"wood",{pos:[o,.21,l],floorId:"K1",apartmentId:st,roomId:"yatak3",name:"bed3"})),i.add(N(.95,.16,1.8,"fabricLight",{pos:[o,.48,l],floorId:"K1",apartmentId:st,roomId:"yatak3"})),i.add(N(1,.7,.08,"wood",{pos:[o,.5,l-.98],floorId:"K1",apartmentId:st,roomId:"yatak3"})),i.add(N(.5,1.6,.35,"woodDark",{pos:[o+1,.8,l],floorId:"K1",apartmentId:st,roomId:"yatak3"}))}function M0(i){i.add(N(2.2,.03,2.2,"ceramic",{pos:[-.8,.03,-3.9],floorId:"K1",apartmentId:st,roomId:"banyo",castShadow:!1})),i.add(N(1.7,.55,.75,"ceramic",{pos:[-.8,.28,-3.9-.7],floorId:"K1",apartmentId:st,roomId:"banyo",name:"bathtub",meta:{kind:"furniture",id:"K1-D1-kuvet",label:"Küvet (170 × 75)",floorId:"K1",apartmentId:st,roomId:"banyo",info:[["Ölçü","1.7 × 0.75 m"],["Malzeme","Akrilik"]]}})),i.add(N(1.5,.08,.55,"water",{pos:[-.8,.5,-3.9-.7],floorId:"K1",apartmentId:st,roomId:"banyo",castShadow:!1})),i.add(N(1,.16,.5,"ceramic",{pos:[-.8+.55,.82,-3.9+.85],floorId:"K1",apartmentId:st,roomId:"banyo"})),i.add(N(.06,.75,1,"glass",{pos:[-.8+1.02,1.55,-3.9+.85],rotY:Math.PI/2,floorId:"K1",apartmentId:st,roomId:"banyo",castShadow:!1})),i.add(N(.4,.42,.6,"ceramic",{pos:[-.8-.75,.21,-3.9+.8],floorId:"K1",apartmentId:st,roomId:"banyo"})),i.add(N(.4,.5,.16,"ceramic",{pos:[-.8-.75,.6,-3.9+1.02],floorId:"K1",apartmentId:st,roomId:"banyo"})),i.add(Po(.04,.04,1,"metal",{pos:[-.8-.95,1.7,-3.9-.95],floorId:"K1",apartmentId:st,roomId:"banyo"})),i.add(N(.7,.04,.04,"metal",{pos:[-.8,1.5,-3.9-1.05],floorId:"K1",apartmentId:st,roomId:"banyo"}))}function y0(i){i.add(N(.4,1.1,1.6,"woodDark",{pos:[-.4-.9,.55,0-1.7],floorId:"K1",apartmentId:st,roomId:"antre",name:"shoe-rack",meta:{kind:"furniture",id:"K1-D1-ayakkabilik",label:"Ayakkabılık",floorId:"K1",apartmentId:st,roomId:"antre",info:[["Yükseklik","1.1 m"]]}})),i.add(N(.9,1.6,.04,"glass",{pos:[-.4+.86,1.5,0-1.6],rotY:Math.PI/2,floorId:"K1",apartmentId:st,roomId:"antre",castShadow:!1})),i.add(N(.35,.8,.9,"wood",{pos:[-.4+.7,.4,0-.3],floorId:"K1",apartmentId:st,roomId:"antre"}))}const lr=new Map;function ah(i,t,e,n){let s=lr.get(i);s||(s={geo:t,matKey:e,matrices:[]},lr.set(i,s)),s.matrices.push(n.clone())}function S0(){const i=[];lr.clear();const t=un.filter(n=>n.id!==st);for(const n of t){const s=new pe,r=us[n.quadrant];s.position.set(r.x,0,r.z),s.name=`apt-${n.id}`,s.userData.apartmentId=n.id,s.userData.floorId=n.floorId,s.userData.meta={kind:"apartment",id:n.id,label:`${n.no} — ${n.type}`,floorId:n.floorId,apartmentId:n.id,area:n.area},E0(s),b0(s),rh(s,{kind:"apartment",id:n.id,label:`${n.no} — ${n.type}`,floorId:n.floorId,apartmentId:n.id,area:n.area,info:[["Tip",n.type],["Brüt alan",`${n.area} m²`],["Net alan",`${n.netArea} m²`],["Oda sayısı",`${n.rooms.length}`],["Balkon",n.balcony?"Var":"Yok"],["Not","Bu daire temsilî donatılmıştır"]]},{floorId:n.floorId,apartmentId:n.id}),i.push(s)}const e=[];return lr.forEach(n=>{if(n.matrices.length===0)return;const s=new tr(n.geo,rn(n.matKey),n.matrices.length);n.matrices.forEach((r,a)=>s.setMatrixAt(a,r)),s.instanceMatrix.needsUpdate=!0,s.castShadow=!0,s.receiveShadow=!0,s.name=`instanced-${n.matKey}`,e.push(s)}),{groups:i,meshes:e}}function E0(i,t){const s=[[-2,-5.1,-2,5.1],[-6,.9,6,.9],[-6,-1.6,-2,-1.6],[1.9,-5.1,1.9,-1.6]];for(const[r,a,o,l]of s){const c=o-r,h=l-a,d=Math.hypot(c,h),u=Math.atan2(h,c),m=new se(d,2.85,.12),g=new Vt().makeRotationY(-u).setPosition((r+o)/2,2.85/2,(a+l)/2),v=new Vt().makeTranslation(i.position.x,i.position.y,i.position.z).multiply(g);ah(`wall-${d.toFixed(2)}`,m,"plaster",v)}}function b0(i,t){const e=i.position.y,n=i.position.x,s=i.position.z,r=(a,o,l,c,h,d=0)=>{const u=new Vt().makeRotationY(d).setPosition(n+l,e+c,s+h);ah(`${o}-${a.type}-${a.parameters?.width??0}`,a,o,u)};r(new se(2.4,.55,.95),"fabric",0,.3,3.2),r(new se(1.3,.42,.8),"wood",0,.21,1.7),r(new se(1.7,.5,2),"fabricLight",-3.8,.25,-3),r(new se(1.4,.45,1.9),"fabricLight",-3.8,.22,3),r(new se(.55,2.1,2.2),"woodDark",5.2,1.05,2.6),r(new se(2.6,.9,.6),"woodDark",3.6,.45,-4.6),r(new se(1.6,.74,.9),"wood",3.4,.37,.6),r(new se(.42,.45,.42),"woodDark",2.6,.22,1.4),r(new se(.42,.45,.42),"woodDark",4.2,.22,1.4),r(new se(1.4,.8,.05),"screen",0,1.5,4.9),r(new se(1.5,.55,.7),"ceramic",-4.6,.28,-4.4)}const On={architectural:10466248,structural:15769675,electrical:16110919,water:5155038,waste:10322313,hvac:7268279,fire:15681391};function w0(){const i=[];{const t=Jn("architectural");for(const e of Lt){const n=new qc(new Cg(new se(on.width,e.height,on.depth)),T0(On.architectural,.45));n.position.set(0,e.elevation+e.height/2,0),t.add(n)}i.push({layer:"architectural",group:t})}{const t=Jn("structural"),e=new ue({color:On.structural,emissive:On.structural,emissiveIntensity:.35,roughness:.4,metalness:.3,transparent:!0,opacity:.85}),n=[-15,-8,0,8,15],s=[-11,0,11];for(const r of Lt){for(const a of n)for(const o of s){const l=new Nt(new se(.45,r.height,.45),e);l.position.set(a,r.elevation+r.height/2,o),l.castShadow=!1,l.userData.layer="structural",t.add(l)}for(const a of n){const o=new Nt(new se(.32,.42,on.depth),e);o.position.set(a,r.elevation+r.height-.3,0),t.add(o)}for(const a of s){const o=new Nt(new se(on.width,.42,.32),e);o.position.set(0,r.elevation+r.height-.3,a),t.add(o)}}for(const[r,a,o,l]of[[-7/2,0,.4,Gt.depth],[Gt.width/2,0,.4,Gt.depth],[0,-6/2,Gt.width,.4]]){const c=new Nt(new se(o,16.5,l),e);c.position.set(r,8.2,a),t.add(c)}i.push({layer:"structural",group:t})}{const t=Jn("electrical"),e=ts(On.electrical),n=-3.2,s=-2.6;t.add(Xs(n,s,-3.2,Ei,e));for(const r of Lt){const a=new Nt(new se(.5,.7,.2),e);a.position.set(n+.5,r.elevation+1.8,s+.3),t.add(a);for(const[o,l,c,h]of[[0,-5.6,20,0],[0,5.6,20,0],[-12.5,0,9,Math.PI/2],[12.5,0,9,Math.PI/2]]){if(r.index<0)continue;const d=new Nt(new Xe(.05,.05,c,6),e);d.rotation.z=Math.PI/2,d.rotation.y=h,d.position.set(o,r.elevation+r.height-.4,l),t.add(d)}}i.push({layer:"electrical",group:t})}{const t=Jn("water"),e=ts(On.water),n=3,s=2.8;t.add(Xs(n,s,-3.2,Ei,e,.085));const r=new Nt(new Xe(1.1,1.1,1.8,16),e);r.position.set(12,.9,-9.2),t.add(r);const a=new Nt(new Xe(.07,.07,10,6),e);a.rotation.z=Math.PI/2,a.position.set(7.5,2.5,-9.2),t.add(a);for(const o of Lt){if(o.index<0)continue;const l=new Nt(new Xe(.055,.055,22,6),e);l.rotation.z=Math.PI/2,l.position.set(0,o.elevation+2.6,s),t.add(l);for(const c of Object.values(us)){const h=new Nt(new Xe(.045,.045,2.2,6),e);h.position.set(c.x*1.1,o.elevation+1.5,c.z*.9),t.add(h)}}i.push({layer:"water",group:t})}{const t=Jn("waste"),e=ts(On.waste,.8),n=3.6,s=2.2;t.add(Xs(n,s,-3.2,Ei,e,.11));for(const r of Lt){if(r.index<0)continue;const a=new Nt(new Xe(.07,.07,18,6),e);a.rotation.z=Math.PI/2,a.position.set(1,r.elevation+.25,s-1.2),t.add(a)}i.push({layer:"waste",group:t})}{const t=Jn("hvac"),e=ts(On.hvac,.55),n=-3.9,s=3.2,r=new Nt(new se(1.2,Ei+3.2,1.2),e);r.position.set(n,(Ei-3.2)/2,s),t.add(r);for(const a of Lt){if(a.index<0)continue;const o=new Nt(new se(20,.55,.75),e);o.position.set(0,a.elevation+a.height-.65,s),t.add(o);for(let l=-3;l<=3;l++){const c=new Nt(new se(.7,.14,.5),e);c.position.set(l*3,a.elevation+a.height-.95,s),t.add(c)}}i.push({layer:"hvac",group:t})}{const t=Jn("fire"),e=ts(On.fire,.7);t.add(Xs(-2,-3.6,-3.2,Ei,e,.075));for(const r of Lt){if(r.index<0)continue;const a=new Nt(new Xe(.045,.045,26,6),e);a.rotation.z=Math.PI/2,a.position.set(0,r.elevation+r.height-.25,-6.5),t.add(a);const o=a.clone();o.position.z=6.5,t.add(o);for(let c=-5;c<=5;c++)for(const h of[-6.5,6.5]){const d=new Nt(new Xe(.07,.03,.18,6),e);d.position.set(c*2.4,r.elevation+r.height-.38,h),t.add(d)}const l=new Nt(new se(.7,1,.25),e);l.position.set(Gt.width/2+.3,r.elevation+1.2,Gt.depth/2+.3),t.add(l)}i.push({layer:"fire",group:t})}return i}function Jn(i){const t=new pe;return t.name=`xray-${i}`,t.visible=!1,t.userData.layer=i,t}function ts(i,t=.9){return new ue({color:i,emissive:i,emissiveIntensity:.55,roughness:.35,metalness:.2,transparent:!0,opacity:t})}function T0(i,t){return new xo({color:i,transparent:!0,opacity:t})}function Xs(i,t,e,n,s,r=.06){const a=n-e,o=new Nt(new Xe(r,r,a,8),s);return o.position.set(i,e+a/2,t),o}class A0{constructor(t){j(this,"systems");j(this,"activeLayers",new Set);j(this,"facadeMeshes",[]);j(this,"outerWalls",[]);j(this,"roofGroup",null);j(this,"enabled",!1);this.systems=t}registerFacade(t){this.facadeMeshes.push(...t)}registerRoof(t){this.roofGroup=t}registerOuterWalls(t){this.outerWalls.push(...t)}setEnabled(t){if(this.enabled=t,!t){this.systems.forEach(e=>e.group.visible=!1),this.activeLayers.clear(),this.applyFacadeFade(!1);return}this.activeLayers=new Set(Co.filter(e=>e.key!=="architectural").map(e=>e.key)),this.systems.forEach(e=>e.group.visible=e.layer==="architectural"?!0:this.activeLayers.has(e.layer)),this.applyFacadeFade(!0)}toggleLayer(t,e){e?this.activeLayers.add(t):this.activeLayers.delete(t);const n=this.systems.find(s=>s.layer===t);n&&(n.group.visible=e&&this.enabled),t==="architectural"&&this.applyFacadeFade(this.enabled)}isLayerOn(t){return this.enabled&&this.activeLayers.has(t)}get activeCount(){return this.enabled?this.activeLayers.size:0}applyFacadeFade(t){this.facadeMeshes.forEach(e=>{const n=e.material;n.userData.origOpacity||(n.userData.origOpacity=n.opacity),n.transparent=!0,n.opacity=t?.03:n.userData.origOpacity,n.depthWrite=!t,n.needsUpdate=!0}),this.outerWalls.forEach(e=>{const n=e.material;n.userData.origOpacity||(n.userData.origOpacity=n.opacity),n.transparent=!0,n.opacity=t?.14:n.userData.origOpacity,n.needsUpdate=!0}),this.roofGroup&&(this.roofGroup.visible=!t||!this.activeLayers.has("structural"))}dispose(){this.systems.forEach(t=>{t.group.traverse(e=>{const n=e;n.isMesh&&n.geometry.dispose()})})}}class C0{constructor(){j(this,"root",new pe);j(this,"floors",new Map);j(this,"core",new m0);j(this,"heroApartment");j(this,"xray");j(this,"colliders",[]);j(this,"roofGroup");j(this,"exploded",0);j(this,"isolated",null);j(this,"roofsHidden",!1);this.root.name="building",this.root.position.y=0;for(const r of Lt){const o=d0(r).group;r.kind==="basement"&&f0(o),r.kind==="ground"&&p0(o),r.kind==="penthouse"&&R0(o),this.root.add(o),this.floors.set(r.id,{id:r.id,group:o,baseY:r.elevation,height:r.height,index:r.index})}this.root.add(this.core.group),this.heroApartment=g0(),this.floors.get("K1").group.add(this.heroApartment.group);const e=S0();for(const r of e.groups){const a=this.floors.get(r.userData.floorId);a&&a.group.add(r)}e.meshes.forEach(r=>this.root.add(r)),this.roofGroup=u0(),this.floors.get("K5").group.add(this.roofGroup);const s=w0();s.forEach(r=>this.root.add(r.group)),this.xray=new A0(s),this.roofGroup.userData.isRoof=!0,this.collectColliders(),this.registerFacades()}registerFacades(){const t=[];this.root.traverse(e=>{const n=e;if(!n.isMesh)return;if(n.userData.ctx?.collider===!0){const r=new fn().setFromObject(n);if(r.isEmpty())return;r.expandByScalar(.05),this.colliders.push(r)}(n.name.startsWith("facade-")||n.name==="balcony-rail")&&t.push(n)}),this.xray.registerFacade(t),this.xray.registerRoof(this.roofGroup)}collectColliders(){this.root.traverse(t=>{const e=t;if(!e.isMesh)return;if(e.userData.ctx?.collider===!0){e.updateWorldMatrix(!0,!0);const s=new fn().setFromObject(e);s.isEmpty()||this.colliders.push(s)}})}setExplode(t){this.exploded=t;const e=7.5;Lt.forEach(n=>{const s=this.floors.get(n.id);if(!s)return;const r=n.kind==="basement"?-e*.55*t:n.index*e*t;s.group.position.y=s.baseY+r}),this.roofGroup.position.y=t>.02?this.roofGroup.position.y:0}get explodeValue(){return this.exploded}setIsolate(t){this.isolated=t,Lt.forEach(e=>{const n=this.floors.get(e.id);n&&(n.group.visible=t===null?!0:e.id===t)}),this.core.group.visible=t===null,this.roofGroup.visible=t===null||t==="K5"}get isolatedFloor(){return this.isolated}setCeilingsHidden(t){this.roofsHidden=t,this.heroApartment.group.traverse(e=>{e.userData.isCeiling&&(e.visible=!t)}),this.floors.forEach(e=>{e.group.traverse(n=>{const s=n;s.isMesh&&s.name==="lobby-ceiling"&&(s.visible=!t)})})}get ceilingsHidden(){return this.roofsHidden}get heroLights(){return this.heroApartment.lights}get heroDoors(){return this.heroApartment.doors}updateDoors(t){for(const e of this.heroDoors)if(e.targetAngle!==e.angle){const n=e.targetAngle-e.angle,s=Math.sign(n)*Math.min(Math.abs(n),t*4.5);e.angle+=s,e.pivot.rotation.y=e.angle+(e.pivot.userData.baseRotY??0)}}lightStats(){let t=0,e=0,n=0;for(const s of this.heroApartment.lights)s.on?(t++,n+=s.powerW):e++;return{on:t,off:e,watts:n}}dispose(){this.root.traverse(t=>{const e=t;e.isMesh&&e.geometry&&e.geometry.dispose()}),this.xray.dispose()}}function R0(i){const t=Lt.find(e=>e.id==="K5").height;for(const[e,n,s,r]of[[-8.5,-6,12.4,9.6],[8.5,6,12.4,9.6]])i.add(N(s,t-.4,r,"plaster",{pos:[e,(t-.4)/2,n],floorId:"K5",name:"penthouse-mass",meta:{kind:"apartment",id:e<0?"K5-D1":"K5-D2",label:e<0?"501 — 4+1 Dubleks":"502 — 4+1 Dubleks",floorId:"K5",apartmentId:e<0?"K5-D1":"K5-D2",area:248,info:[["Tip","4+1 çatı dubleksi"],["Brüt","248 m²"],["Özellik","Teras + çift yükseklik salon"]]}})),i.add(N(s*.62,t*.62,.08,"glass",{pos:[e,t*.34,n-r/2],floorId:"K5",castShadow:!1,name:"penthouse-glass"}))}function P0(){const i=new pe;i.name="site";const t=new Nt(new Bi(400,400),rn("grass"));t.rotation.x=-Math.PI/2,t.position.y=-.01,t.receiveShadow=!0,t.name="ground",i.add(t);const e=N(160,.02,9,"asphalt",{pos:[0,.005,34],receiveShadow:!0,castShadow:!1,name:"road-main",meta:{kind:"floor",id:"road",label:"Çevre Yolu",info:[["Genişlik","9 m"]]}});i.add(e);const n=N(9,.02,70,"asphalt",{pos:[-40,.005,0],receiveShadow:!0,castShadow:!1,name:"road-side"});i.add(n);for(let R=-9;R<=9;R++)i.add(N(2.4,.02,.14,"plaster",{pos:[R*8,.02,34],castShadow:!1,receiveShadow:!1,name:"road-line"}));const s=[[0,19,3.2,22],[0,-16.5,3.2,10],[-19,0,4,3],[19,0,4,3]];for(const[R,A,T,P]of s)i.add(N(T,.06,P,"stone",{pos:[R,.03,A],receiveShadow:!0,castShadow:!1,name:"path",meta:{kind:"floor",id:`path-${R}-${A}`,label:"Yürüyüş Yolu",info:[["Genişlik",`${T} m`],["Kaplama","Bazalt plaka"]]}}));const r=new Nt(new To(24,26.4,64),rn("stone"));r.rotation.x=-Math.PI/2,r.position.y=.04,r.receiveShadow=!0,r.name="perimeter-path",i.add(r);for(const[R,A,T,P]of[[-20,15,14,12],[20,15,14,12],[-20,-14,12,10],[20,-14,12,10]])i.add(N(T,.04,P,"grass",{pos:[R,.02,A],castShadow:!1,receiveShadow:!0,name:"lawn"}));const a=[],o=I0(1337);for(let R=0;R<46;R++){const A=o()*Math.PI*2,T=20+o()*26,P=Math.cos(A)*T,z=Math.sin(A)*T;Math.abs(P)<20&&Math.abs(z)<16||Math.abs(z-34)<7||a.push([P,0,z])}[[-12,16],[-7,17.5],[7,17.5],[12,16],[-14,-16],[14,-16],[-24,6],[-24,-6],[24,6],[24,-6]].forEach(([R,A])=>a.push([R,0,A]));const c=new Xe(.16,.26,4.2,6),h=new wo(1.9,0),d=new tr(c,rn("woodDark"),a.length),u=new tr(h,rn("foliage"),a.length),m=new tr(h,rn("foliageDark"),a.length),g=new Vt,v=new Gn,p=new w;a.forEach(([R,,A],T)=>{const P=.8+o()*.7;g.compose(new w(R,2.1*P,A),v,p.set(P,P,P)),d.setMatrixAt(T,g),g.compose(new w(R,4.4*P,A),v,p.set(P,P*.86,P)),u.setMatrixAt(T,g);const z=.9*P;g.compose(new w(R+z,3.5*P,A+z*.6),v,p.set(P*.7,P*.62,P*.7)),m.setMatrixAt(T,g)}),[d,u,m].forEach(R=>{R.castShadow=!0,R.receiveShadow=!0,R.instanceMatrix.needsUpdate=!0,i.add(R)});const f=[[-6,0,15],[6,0,15],[-18,0,8],[18,0,8],[-10,0,-15],[10,0,-15]];for(const[R,,A]of f){const T=new pe;T.position.set(R,0,A),T.add(N(1.8,.07,.5,"wood",{pos:[0,.45,0],name:"bench-seat"})),T.add(N(1.8,.45,.07,"wood",{pos:[0,.68,-.22],name:"bench-back"})),T.add(N(.08,.45,.45,"metal",{pos:[-.75,.22,0],name:"bench-leg"})),T.add(N(.08,.45,.45,"metal",{pos:[.75,.22,0],name:"bench-leg"})),T.traverse(P=>{const z=P;z.isMesh&&(z.userData.meta={kind:"furniture",id:`bench-${R}-${A}`,label:"Bahçe Bankı",info:[["Ölçü","1.8 m"],["Malzeme","Teak + dökme demir"]]})}),i.add(T)}const y=0,M=27.5;i.add(N(14,.4,6,"marble",{pos:[y,.2,M],name:"pool-deck"})),i.add(N(12.4,.3,4.4,"water",{pos:[y,.36,M],castShadow:!1,name:"pool-water",meta:{kind:"floor",id:"pool",label:"Yüzme Havuzu",info:[["Ölçü","12.4 × 4.4 m"],["Derinlik","1.4 m"]]}})),i.add(N(5,.12,9,"asphalt",{pos:[-13.5,.02,-17.5],rotX:.04,name:"ramp-entry",castShadow:!1,meta:{kind:"floor",id:"ramp-entry",label:"Otopark Girişi",info:[["Genişlik","5 m"],["Not","Bodrum otoparka iniş"]]}}));const b=[[-72,-38,18,14,16,"concreteDark"],[-74,48,16,12,22,"plaster"],[70,-36,20,16,12,"concrete"],[78,50,22,14,28,"concreteDark"],[0,-70,26,18,18,"plaster"]];for(const[R,A,T,P,z,_]of b){i.add(N(T,z,P,_,{pos:[R,z/2,A],name:"neighbor-building",castShadow:!0,receiveShadow:!0,meta:{kind:"floor",id:`neighbor-${R}-${A}`,label:"Komşu Yapı",info:[["Yükseklik",`${z} m`],["Not","Çevre bağlamı için sade kütle"]]}}));for(let E=1;E<Math.floor(z/3.4);E++)i.add(N(T+.06,1.3,P+.06,"glassDark",{pos:[R,E*3.4,A],castShadow:!1,receiveShadow:!1,name:"neighbor-glass"}))}for(let R=-4;R<=4;R++){const A=R*16;i.add(Po(.08,.1,6,"metalDark",{pos:[A,3,29],name:"streetlamp-pole"})),i.add(N(1,.12,.4,"metalDark",{pos:[A,6,28.7],name:"streetlamp-arm"}));const T=N(.7,.1,.3,"emissiveCool",{pos:[A,5.92,28.4],castShadow:!1,name:"streetlamp-head"});T.userData.isStreetLamp=!0,i.add(T)}return i}function I0(i){return function(){i|=0,i=i+1831565813|0;let t=Math.imul(i^i>>>15,1|i);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}const L0=`
varying vec3 vWorldDir;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(worldPos.xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,D0=`
uniform vec3 uTopColor;
uniform vec3 uHorizonColor;
uniform vec3 uBottomColor;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uSunSize;
varying vec3 vWorldDir;

void main() {
  vec3 dir = normalize(vWorldDir);
  float h = clamp(dir.y * 1.4, -1.0, 1.0);
  // gök gradyanı
  vec3 col = mix(uHorizonColor, uTopColor, pow(clamp(h, 0.0, 1.0), 0.55));
  // ufkun ALTINDA yalnızca çok yakın bant koyulaşır (zemin zaten opak, kubbe görünmez)
  col = mix(col, uBottomColor, pow(clamp(-h, 0.0, 1.0), 2.5) * 0.85);

  // güneş diski + halo
  float d = dot(dir, normalize(uSunDir));
  float disc = smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, d);
  float halo = pow(max(d, 0.0), 22.0) * 0.55 + pow(max(d, 0.0), 4.0) * 0.12;
  col += uSunColor * (disc * 2.4 + halo) * uSunIntensity;

  // hafif atmosferik bant
  col += uSunColor * 0.04 * pow(max(0.0, 1.0 - abs(h - 0.05) * 4.0), 2.0) * uSunIntensity;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;class U0{constructor(t,e){j(this,"sunLight");j(this,"hemi");j(this,"ambient");j(this,"sky");j(this,"skyMat");j(this,"sunDir",new w(.5,.8,.3));j(this,"pmrem");j(this,"envRT",null);j(this,"envScene");j(this,"envSphere");j(this,"rain",null);j(this,"snow",null);j(this,"rainVel",null);j(this,"snowVel",null);j(this,"time",0);j(this,"hour",17.5);j(this,"weather","sunny");j(this,"scene");j(this,"renderer");j(this,"nightLights",[]);j(this,"nightBoost",0);this.scene=t,this.renderer=e,this.skyMat=new Re({uniforms:{uTopColor:{value:new ot(2780080)},uHorizonColor:{value:new ot(12441576)},uBottomColor:{value:new ot(6253168)},uSunColor:{value:new ot(16767144)},uSunDir:{value:new w(.4,.6,.3)},uSunIntensity:{value:1},uSunSize:{value:9e-4}},vertexShader:L0,fragmentShader:D0,side:Le,depthWrite:!1});const n=new pr(600,40,20);this.sky=new Nt(n,this.skyMat),this.sky.name="sky",this.sky.frustumCulled=!1,t.add(this.sky),this.sunLight=new Dg(16773336,3.2),this.sunLight.castShadow=!0;const s=2048;this.sunLight.shadow.mapSize.set(s,s),this.sunLight.shadow.camera.near=1,this.sunLight.shadow.camera.far=140;const r=45;this.sunLight.shadow.camera.left=-r,this.sunLight.shadow.camera.right=r,this.sunLight.shadow.camera.top=r,this.sunLight.shadow.camera.bottom=-r,this.sunLight.shadow.bias=-4e-4,this.sunLight.shadow.normalBias=.03,t.add(this.sunLight),t.add(this.sunLight.target),this.hemi=new Pg(12376304,4867640,.55),t.add(this.hemi),this.ambient=new Ug(16777215,.18),t.add(this.ambient),this.pmrem=new Ka(e),this.pmrem.compileEquirectangularShader(),this.envScene=new vo,this.envSphere=new Nt(n.clone(),this.skyMat),this.envSphere.frustumCulled=!1,this.envScene.add(this.envSphere),this.buildNightFacadeLights(),this.buildWeather(),this.apply()}buildNightFacadeLights(){const t=[[0,1.6,14],[0,1.6,-14],[-17.5,1.6,0],[17.5,1.6,0]];for(const[e,n,s]of t){const r=new eh(16763274,0,26,2);r.position.set(e,n,s),r.castShadow=!1,this.scene.add(r),this.nightLights.push(r)}}applyNightLights(){const t=this.isNight?1:0;this.nightLights.forEach(n=>{n.intensity+=(t*30-n.intensity)*.18});const e=rn("glass");if(e){e.emissive||(e.emissive=new ot(16758629));const n=this.isNight?.11:0;e.emissiveIntensity+=(n-e.emissiveIntensity)*.1,e.emissive.setHex(this.isNight?16755021:0),e.needsUpdate=!0}}apply(){const t=this.hour,e=(t-6)/12,n=Math.sin(Math.max(0,Math.min(1,e))*Math.PI),s=e*Math.PI-Math.PI/2,r=t<6||t>18.6,a=Math.cos(s)*60,o=Math.sin(s)*40+8,l=Math.max(.6,n*70);if(r){const O=(t<6?(t+6)/12:(t-18)/6)*Math.PI;this.sunDir.set(Math.cos(O)*60,35+Math.sin(O)*20,Math.sin(O)*30)}else this.sunDir.set(a,l,o);const c=this.sunDir.clone();this.sunLight.position.copy(c),this.sunLight.target.position.set(0,8,0),this.sunLight.target.updateMatrixWorld();const h=new ot(3108789),d=new ot(1780298),u=new ot(329743),m=new ot(13624304),g=new ot(15896922),v=new ot(857120),p=new ot(9080722),f=new ot(4864826),y=new ot(461326),M=Math.max(0,1-Math.abs(t-18)/2.2)*(t<=19?1:.4),b=Math.max(0,1-Math.abs(t-6.4)/2);let R=h.clone(),A=m.clone(),T=p.clone();const P=this.weather==="sunny";if(this.weather!=="sunny"&&(R.lerp(new ot(7042692),.75),A.lerp(new ot(11055288),.75),T.lerp(new ot(6120298),.7)),r){const E=Math.min(1,t<6?(6-t)/3:(t-18.4)/2.5);R.lerp(u,E*.95),A.lerp(v,E*.95),T.lerp(y,E*.95)}else M>.01?(R.lerp(d,M*.7),A.lerp(g,M*.85),T.lerp(f,M*.6)):b>.01&&(R.lerp(d,b*.45),A.lerp(new ot(16169357),b*.6));this.skyMat.uniforms.uTopColor.value.copy(R),this.skyMat.uniforms.uHorizonColor.value.copy(A),this.skyMat.uniforms.uBottomColor.value.copy(T),this.skyMat.uniforms.uSunDir.value.copy(this.sunDir).normalize();const z=new ot(16773848);M>.01&&z.lerp(new ot(16748362),M*.85),this.skyMat.uniforms.uSunColor.value.copy(z),this.skyMat.uniforms.uSunIntensity.value=r?.35:1,this.skyMat.uniforms.uSunSize.value=r?25e-5:7e-4;const _=Math.max(.05,n)*3.6*(P?1:.32);this.sunLight.intensity=r?.075:_,this.sunLight.color.copy(r?new ot(9414872):z),this.hemi.intensity=r?.13:(.45+n*.35)*(P?1:.75),this.hemi.color.copy(r?new ot(1713208):new ot(12376304)),this.hemi.groundColor.copy(r?new ot(658448):new ot(4867640)),this.ambient.intensity=r?.035:.16,this.renderer.toneMappingExposure=r?1.35:.95+n*.15,this.updateEnv(),this.updateWeatherVisibility()}updateEnv(){this.envRT?.dispose(),this.envRT=this.pmrem.fromScene(this.envScene,0,.1,500),Qg(this.envRT.texture),this.scene.environment=this.envRT.texture}setHour(t){this.hour=(t%24+24)%24,this.apply(),this.updateLightsByHour()}setWeather(t){this.weather=t,this.updateWeatherVisibility(),this.apply()}get isNight(){return this.hour<6.4||this.hour>18.2}updateLightsByHour(){const t=this.isNight?1:.55;this.nightBoost+=(t-this.nightBoost)*.5}buildWeather(){const e=new Se,n=new Float32Array(2600*3),s=new Float32Array(2600);for(let d=0;d<2600;d++)n[d*3]=(Math.random()-.5)*120,n[d*3+1]=Math.random()*45,n[d*3+2]=(Math.random()-.5)*120,s[d]=22+Math.random()*16;e.setAttribute("position",new Be(n,3)),this.rainVel=s;const r=new qa({color:12572906,size:.09,transparent:!0,opacity:.55,sizeAttenuation:!0,depthWrite:!1});this.rain=new Gl(e,r),this.rain.name="rain",this.rain.visible=!1,this.scene.add(this.rain);const a=1800,o=new Se,l=new Float32Array(a*3),c=new Float32Array(a);for(let d=0;d<a;d++)l[d*3]=(Math.random()-.5)*120,l[d*3+1]=Math.random()*45,l[d*3+2]=(Math.random()-.5)*120,c[d]=1.2+Math.random()*1.8;o.setAttribute("position",new Be(l,3)),this.snowVel=c;const h=new qa({color:16777215,size:.16,transparent:!0,opacity:.9,sizeAttenuation:!0,depthWrite:!1});this.snow=new Gl(o,h),this.snow.name="snow",this.snow.visible=!1,this.scene.add(this.snow)}updateWeatherVisibility(){this.rain&&(this.rain.visible=this.weather==="rain"),this.snow&&(this.snow.visible=this.weather==="snow")}update(t){if(this.time+=t,this.rain&&this.rain.visible&&this.rainVel){const n=this.rain.geometry.getAttribute("position"),s=n.array;for(let r=0;r<s.length/3;r++)s[r*3+1]-=this.rainVel[r]*t,s[r*3+1]<0&&(s[r*3+1]=45,s[r*3]=(Math.random()-.5)*120,s[r*3+2]=(Math.random()-.5)*120);n.needsUpdate=!0}if(this.snow&&this.snow.visible&&this.snowVel){const n=this.snow.geometry.getAttribute("position"),s=n.array;for(let r=0;r<s.length/3;r++)s[r*3+1]-=this.snowVel[r]*t,s[r*3]+=Math.sin(this.time*.8+r)*t*.35,s[r*3+1]<0&&(s[r*3+1]=45,s[r*3]=(Math.random()-.5)*120,s[r*3+2]=(Math.random()-.5)*120);n.needsUpdate=!0}const e=this.isNight?1:.5;this.nightBoost+=(e-this.nightBoost)*Math.min(1,t*2),this.applyNightLights()}get interiorLightFactor(){return this.nightBoost}setShadowQuality(t){this.sunLight.shadow.mapSize.set(t,t),this.sunLight.shadow.map?.dispose(),this.sunLight.shadow.map=null}dispose(){this.envRT?.dispose(),this.pmrem.dispose(),this.sky.geometry.dispose(),this.skyMat.dispose(),this.rain?.geometry.dispose(),this.rain?.material?.dispose(),this.snow?.geometry.dispose(),this.snow?.material?.dispose()}}const lc={type:"change"},Io={type:"start"},oh={type:"end"},Ys=new ds,cc=new kn,N0=Math.cos(70*jh.DEG2RAD),xe=new w,Oe=2*Math.PI,re={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},sa=1e-6;class F0 extends Og{constructor(t,e=null){super(t,e),this.state=re.NONE,this.enabled=!0,this.target=new w,this.cursor=new w,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ti.ROTATE,MIDDLE:Ti.DOLLY,RIGHT:Ti.PAN},this.touches={ONE:bi.ROTATE,TWO:bi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new w,this._lastQuaternion=new Gn,this._lastTargetPosition=new w,this._quat=new Gn().setFromUnitVectors(t.up,new w(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Jl,this._sphericalDelta=new Jl,this._scale=1,this._panOffset=new w,this._rotateStart=new tt,this._rotateEnd=new tt,this._rotateDelta=new tt,this._panStart=new tt,this._panEnd=new tt,this._panDelta=new tt,this._dollyStart=new tt,this._dollyEnd=new tt,this._dollyDelta=new tt,this._dollyDirection=new w,this._mouse=new tt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=k0.bind(this),this._onPointerDown=O0.bind(this),this._onPointerUp=B0.bind(this),this._onContextMenu=Y0.bind(this),this._onMouseWheel=G0.bind(this),this._onKeyDown=V0.bind(this),this._onTouchStart=W0.bind(this),this._onTouchMove=X0.bind(this),this._onMouseDown=z0.bind(this),this._onMouseMove=H0.bind(this),this._interceptControlDown=K0.bind(this),this._interceptControlUp=$0.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(lc),this.update(),this.state=re.NONE}update(t=null){const e=this.object.position;xe.copy(e).sub(this.target),xe.applyQuaternion(this._quat),this._spherical.setFromVector3(xe),this.autoRotate&&this.state===re.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=Oe:n>Math.PI&&(n-=Oe),s<-Math.PI?s+=Oe:s>Math.PI&&(s-=Oe),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(xe.setFromSpherical(this._spherical),xe.applyQuaternion(this._quatInverse),e.copy(this.target).add(xe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=xe.length();a=this._clampDistance(o*this._scale);const l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){const o=new w(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;const c=new w(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=xe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Ys.origin.copy(this.object.position),Ys.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ys.direction))<N0?this.object.lookAt(this.target):(cc.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ys.intersectPlane(cc,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>sa||8*(1-this._lastQuaternion.dot(this.object.quaternion))>sa||this._lastTargetPosition.distanceToSquared(this.target)>sa?(this.dispatchEvent(lc),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?Oe/60*this.autoRotateSpeed*t:Oe/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){xe.setFromMatrixColumn(e,0),xe.multiplyScalar(-t),this._panOffset.add(xe)}_panUp(t,e){this.screenSpacePanning===!0?xe.setFromMatrixColumn(e,1):(xe.setFromMatrixColumn(e,0),xe.crossVectors(this.object.up,xe)),xe.multiplyScalar(t),this._panOffset.add(xe)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;xe.copy(s).sub(this.target);let r=xe.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Oe*this._rotateDelta.x/e.clientHeight),this._rotateUp(Oe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(Oe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateUp(-Oe*this.rotateSpeed/this.domElement.clientHeight):this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(Oe*this.rotateSpeed/this.domElement.clientHeight):this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this._rotateLeft(-Oe*this.rotateSpeed/this.domElement.clientHeight):this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(Oe*this._rotateDelta.x/e.clientHeight),this._rotateUp(Oe*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new tt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function O0(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function k0(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function B0(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(oh),this.state=re.NONE;break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function z0(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Ti.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=re.DOLLY;break;case Ti.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=re.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=re.ROTATE}break;case Ti.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=re.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=re.PAN}break;default:this.state=re.NONE}this.state!==re.NONE&&this.dispatchEvent(Io)}function H0(i){switch(this.state){case re.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case re.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case re.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function G0(i){this.enabled===!1||this.enableZoom===!1||this.state!==re.NONE||(i.preventDefault(),this.dispatchEvent(Io),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(oh))}function V0(i){this.enabled===!1||this.enablePan===!1||this._handleKeyDown(i)}function W0(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case bi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=re.TOUCH_ROTATE;break;case bi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=re.TOUCH_PAN;break;default:this.state=re.NONE}break;case 2:switch(this.touches.TWO){case bi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=re.TOUCH_DOLLY_PAN;break;case bi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=re.TOUCH_DOLLY_ROTATE;break;default:this.state=re.NONE}break;default:this.state=re.NONE}this.state!==re.NONE&&this.dispatchEvent(Io)}function X0(i){switch(this._trackPointer(i),this.state){case re.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case re.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case re.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case re.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=re.NONE}}function Y0(i){this.enabled!==!1&&i.preventDefault()}function K0(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function $0(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}class q0{constructor(t,e){j(this,"camera");j(this,"controls");j(this,"renderer");j(this,"containerEl");j(this,"mode","exterior");j(this,"walkPos",new w(-8,0,10));j(this,"walkYaw",0);j(this,"walkPitch",0);j(this,"walkFloorId","Z");j(this,"keys",new Set);j(this,"colliders",[]);j(this,"pointerLocked",!1);j(this,"dragging",!1);j(this,"cineCurve",null);j(this,"cineLook",null);j(this,"cineT",0);j(this,"cinePlaying",!1);j(this,"cineDuration",42);j(this,"onModeChange",null);j(this,"onCinematicProgress",null);this.renderer=t,this.containerEl=e,this.camera=new Ye(52,1,.1,900),this.camera.position.set(52,30,58),this.controls=new F0(this.camera,t.domElement),this.controls.target.set(0,9,0),this.controls.enableDamping=!0,this.controls.dampingFactor=.06,this.controls.minDistance=14,this.controls.maxDistance=190,this.controls.maxPolarAngle=Math.PI*.495,this.controls.minPolarAngle=.06,this.controls.autoRotate=!0,this.controls.autoRotateSpeed=.35,this.controls.update(),this.buildCinematicPath(),this.bindEvents(),this.resize()}buildCinematicPath(){const t=[new w(58,34,64),new w(40,22,42),new w(12,15,30),new w(0,6.4,22),new w(0,2.1,14),new w(0,2,4.5),new w(-4.5,1.9,3.2),new w(Gt.elevatorA.x,2.4,Gt.elevatorA.z+1.6),new w(Gt.elevatorA.x,Lt[3].elevation+2,Gt.elevatorA.z+1.4),new w(-6,Lt[3].elevation+2,-5),new w(-8,Lt[1].elevation+2.2,-3.5),new w(-5,Lt[1].elevation+2,4.5),new w(-10,Lt[5].elevation+3,6.5),new w(-4,Lt[5].elevation+3.4,12),new w(26,24,40)];this.cineCurve=new ja(t,!1,"catmullrom",.35);const e=[new w(0,12,0),new w(0,12,0),new w(0,10,0),new w(0,3.5,6),new w(0,2.6,0),new w(-2,2.2,-1),new w(Gt.elevatorA.x,2,Gt.elevatorA.z),new w(Gt.elevatorA.x,2.2,Gt.elevatorA.z),new w(-4,Lt[3].elevation+1.6,-3),new w(-6,Lt[3].elevation+1.8,-6),new w(-6,Lt[1].elevation+1.6,2),new w(-3,Lt[1].elevation+1.4,8),new w(-8,Lt[5].elevation+2,4),new w(-8,Lt[5].elevation+2.2,9),new w(0,10,0)];this.cineLook=new ja(e,!1,"catmullrom",.35)}bindEvents(){const t=this.renderer.domElement;window.addEventListener("keydown",s=>{this.keys.add(s.code),s.code==="Escape"&&this.pointerLocked&&(document.exitPointerLock?.(),this.pointerLocked=!1)}),window.addEventListener("keyup",s=>this.keys.delete(s.code)),t.addEventListener("click",()=>{this.mode==="interior"&&!this.pointerLocked&&t.requestPointerLock?.()}),document.addEventListener("pointerlockchange",()=>{this.pointerLocked=document.pointerLockElement===t}),t.addEventListener("mousedown",()=>{this.mode==="interior"&&(this.dragging=!0)}),window.addEventListener("mouseup",()=>this.dragging=!1),document.addEventListener("mousemove",s=>{this.mode==="interior"&&(!this.pointerLocked&&!this.dragging||(this.walkYaw-=s.movementX*.0022,this.walkPitch-=s.movementY*.0022,this.walkPitch=Math.max(-1.2,Math.min(1.2,this.walkPitch))))});let e=0,n=0;t.addEventListener("touchstart",s=>{s.touches.length===1&&this.mode==="interior"&&(e=s.touches[0].clientX,n=s.touches[0].clientY)},{passive:!0}),t.addEventListener("touchmove",s=>{if(this.mode!=="interior"||!this.pointerLocked)return;const r=s.touches[0];this.walkYaw-=(r.clientX-e)*.005,this.walkPitch-=(r.clientY-n)*.005,this.walkPitch=Math.max(-1.2,Math.min(1.2,this.walkPitch)),e=r.clientX,n=r.clientY},{passive:!0})}resize(){const t=this.containerEl.clientWidth||window.innerWidth,e=this.containerEl.clientHeight||window.innerHeight;this.camera.aspect=t/e,this.camera.updateProjectionMatrix()}setColliders(t){this.colliders=t}setMode(t){t===this.mode&&t!=="cinematic"||(this.mode==="interior"&&document.exitPointerLock?.(),this.mode=t,t==="exterior"?(this.controls.enabled=!0,this.controls.autoRotate=!0,this.camera.position.set(52,30,58),this.controls.target.set(0,9,0),this.controls.update()):t==="interior"?(this.controls.enabled=!1,this.controls.autoRotate=!1,this.setInteriorStart(this.walkFloorId??"Z")):t==="cinematic"&&(this.controls.enabled=!1,this.controls.autoRotate=!1,this.cineT=0,this.cinePlaying=!0),this.onModeChange?.(t))}setInteriorStart(t){const e=Lt.find(n=>n.id===t);e&&(this.walkFloorId=t,e.kind==="basement"?(this.walkPos.set(-6,e.elevation,0),this.walkYaw=Math.PI*.5):e.kind==="ground"?(this.walkPos.set(-1.5,e.elevation,8.6),this.walkYaw=Math.PI):(this.walkPos.set(-12.6,e.elevation,0),this.walkYaw=Math.PI*.5),this.walkPitch=-.04,this.ensureFreeStart(),this.updateInteriorCamera())}ensureFreeStart(){const t=this.walkPos.y;if(this.collides(this.walkPos.x,t,this.walkPos.z))for(let e=.6;e<=9;e+=.6)for(let n=0;n<16;n++){const s=n/16*Math.PI*2,r=this.walkPos.x+Math.cos(s)*e,a=this.walkPos.z+Math.sin(s)*e;if(!this.collides(r,t,a)){this.walkPos.set(r,t,a);return}}}updateInteriorCamera(){this.camera.position.set(this.walkPos.x,this.walkPos.y+1.68,this.walkPos.z);const t=new w(Math.sin(this.walkYaw)*Math.cos(this.walkPitch),Math.sin(this.walkPitch),Math.cos(this.walkYaw)*Math.cos(this.walkPitch));this.camera.lookAt(this.camera.position.clone().add(t))}collides(t,e,n,s=.42){const r=e+.1,a=e+1.8;for(const o of this.colliders)if(!(a<o.minY||r>o.maxY)&&t+s>o.minX&&t-s<o.maxX&&n+s>o.minZ&&n-s<o.maxZ)return!0;return Math.abs(t)>90||Math.abs(n)>90}updateInterior(t){const e=this.keys.has("ShiftLeft")||this.keys.has("ShiftRight")?6.2:3;let n=0,s=0;if((this.keys.has("KeyW")||this.keys.has("ArrowUp"))&&(n+=1),(this.keys.has("KeyS")||this.keys.has("ArrowDown"))&&(n-=1),(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))&&(s-=1),(this.keys.has("KeyD")||this.keys.has("ArrowRight"))&&(s+=1),this.keys.has("KeyQ")&&(this.walkYaw+=t*1.4),this.keys.has("KeyE")&&(this.walkYaw-=t*1.4),this.keys.has("Space")&&(this.walkPos.y+=t*2.2),this.keys.has("ControlLeft")&&(this.walkPos.y-=t*2.2),n!==0||s!==0){const r=Math.hypot(n,s)||1,a=Math.sin(this.walkYaw),o=Math.cos(this.walkYaw),l=n/r*a+s/r*Math.cos(this.walkYaw),c=n/r*o-s/r*Math.sin(this.walkYaw),h=this.walkPos.x+l*e*t,d=this.walkPos.z+c*e*t;this.collides(h,this.walkPos.y,this.walkPos.z)||(this.walkPos.x=h),this.collides(this.walkPos.x,this.walkPos.y,d)||(this.walkPos.z=d)}this.updateInteriorCamera()}updateCinematic(t){if(!this.cineCurve||!this.cineLook||!this.cinePlaying)return;this.cineT+=t/this.cineDuration,this.cineT>=1&&(this.cineT=1,this.cinePlaying=!1);const e=this.cineT,n=this.cineCurve.getPointAt(Math.min(1,Math.max(0,e))),s=this.cineLook.getPointAt(Math.min(1,Math.max(0,e)));this.camera.position.lerp(n,Math.min(1,t*6));const r=this.camera.position.clone().add(new w(0,0,-1).applyQuaternion(this.camera.quaternion).multiplyScalar(5));this.camera.lookAt(r.lerp(s,Math.min(1,t*4))),this.onCinematicProgress?.(e)}get cinematicProgress(){return this.cineT}get cinematicPlaying(){return this.cinePlaying}pauseCinematic(){this.cinePlaying=!1}update(t){this.mode==="exterior"?(this.controls.update(),this.camera.position.y<1.2&&(this.camera.position.y=1.2)):this.mode==="interior"?this.updateInterior(t):this.mode==="cinematic"&&this.updateCinematic(t)}reset(){this.setMode("exterior"),this.cineT=0,this.cinePlaying=!1,this.walkPitch=0,this.walkYaw=0}focusOn(t,e=18){if(this.mode==="interior"){this.walkPos.set(t.x,t.y-1.68,t.z+4),this.walkYaw=Math.PI,this.walkPitch=-.1;return}this.mode==="cinematic"&&this.setMode("exterior"),this.controls.autoRotate=!1;const n=this.camera.position.clone().sub(t).normalize();n.lengthSq()<.01&&n.set(.6,.5,.6).normalize(),this.camera.position.copy(t.clone().add(n.multiplyScalar(e))),this.controls.target.copy(t),this.controls.update()}dispose(){this.controls.dispose()}}class Z0{constructor(t,e,n,s){j(this,"raycaster",new Ng);j(this,"pointer",new tt);j(this,"downPos",new tt);j(this,"selected",null);j(this,"hovered",null);j(this,"events");j(this,"building");j(this,"camera");j(this,"dom");j(this,"enabled",!0);j(this,"windowStates",new Map);j(this,"highlightTargets",[]);this.building=t,this.camera=e,this.dom=n,this.events=s,n.addEventListener("pointerdown",r=>{this.downPos.set(r.clientX,r.clientY)}),n.addEventListener("pointerup",r=>{this.downPos.distanceTo(new tt(r.clientX,r.clientY))>6||this.handleClick(r)}),n.addEventListener("pointermove",r=>{r.buttons===0&&this.handleHover(r)})}setEnabled(t){this.enabled=t,this.dom.style.cursor="default"}setPointer(t){const e=this.dom.getBoundingClientRect();this.pointer.x=(t.clientX-e.left)/e.width*2-1,this.pointer.y=-((t.clientY-e.top)/e.height)*2+1}pick(t){this.setPointer(t),this.raycaster.setFromCamera(this.pointer,this.camera);const e=[];return[this.building.root].forEach(s=>{e.push(...this.raycaster.intersectObject(s,!0))}),e.filter(s=>{let r=s.object;for(;r;){if(!r.visible)return!1;r=r.parent}return!0})}handleHover(t){if(!this.enabled)return;this.pick(t).find(s=>s.object.userData.meta)?this.dom.style.cursor="pointer":this.dom.style.cursor="grab"}handleClick(t){if(!this.enabled)return;const e=this.pick(t);if(e.length===0){this.clearSelection();return}const n=e.find(a=>a.object.userData.meta)??e[0],s=n.object,r=s.userData.meta;if(r?.kind==="floor"&&r.floorId&&s.name.startsWith("slab-")&&this.events.onFloorPick(r.floorId),!r){this.clearSelection();return}switch(r.kind){case"door":this.toggleDoor(r.id);break;case"light":this.toggleLightInRoom(r);break;case"window":this.toggleWindow(r,s);break;case"elevator":this.events.onToast("Asansör çağrı paneli — sağ paneldeki kat listesinden kat seçin.");break}this.selected={meta:r,object:s,worldPos:n.point.clone()},this.applyHighlight(s),this.events.onSelect(this.selected)}applyHighlight(t){this.clearHighlight();const e=new fn().setFromObject(t),n=new Fg(e,new ot(7268279));n.name="__selectionHelper",n.material.depthTest=!1,n.material.transparent=!0,n.material.opacity=.9,this.building.root.add(n)}clearHighlight(){const t=this.building.root.getObjectByName("__selectionHelper");t&&(this.building.root.remove(t),t.geometry.dispose(),t.material.dispose())}clearSelection(){this.clearHighlight(),this.selected=null,this.events.onSelect(null)}get selection(){return this.selected}toggleDoor(t){const e=this.building.heroDoors.find(s=>s.id===t);if(!e)return;e.open=!e.open,e.targetAngle=e.open?e.openAngle:0;const n=e.mesh.userData.meta;n&&(n.info=[["Genişlik",n.info?.find(s=>s[0]==="Genişlik")?.[1]??"90 cm"],["Durum",e.open?"Açık":"Kapalı"]]),this.events.onDoorChange(t,e.open),this.events.onToast(`${e.label}: ${e.open?"açıldı":"kapandı"}`),this.selected?.meta.id===t&&(this.selected.meta.info=[["Genişlik","90–110 cm"],["Durum",e.open?"Açık":"Kapalı"]],this.events.onSelect(this.selected))}toggleLightInRoom(t){const e=this.building.heroLights.filter(r=>t.id.startsWith(r.id)||r.meshes.some(a=>a.userData.meta?.id===t.id)),n=this.building.heroLights.find(r=>t.id.startsWith(`light-${r.floorId}-`)&&this.extractRoomFromLightId(t.id)===r.id.split("-").pop()),s=n?[n]:e;s.length!==0&&(s.forEach(r=>this.setLight(r.id,!r.on)),this.events.onLightChange(),this.events.onToast(`Işık: ${s[0].room} — ${s[0].on?"açık":"kapalı"}`))}extractRoomFromLightId(t){return t.split("-")[2]??""}setLight(t,e){const n=this.building.heroLights.find(s=>s.id===t);n&&(n.on=e,n.meshes.forEach(s=>{const r=s.material;r.emissiveIntensity=e?1.6:.04,r.color.setHex(e?16773590:9078136),r.needsUpdate=!0}),n.pointLight&&(n.pointLight.intensity=e?5:0))}toggleWindow(t,e){const s=!(this.windowStates.get(t.id)??!1);this.windowStates.set(t.id,s),this.events.onWindowChange(t.id,s),this.events.onToast(`${t.label}: ${s?"açık":"kapalı"}`),this.selected?.meta.id===t.id&&(this.selected.meta.info=[["Panel","Isı yalıtımlı çift cam"],["Durum",s?"Açık (havalandırma)":"Kapalı"]],this.events.onSelect(this.selected))}cycleMaterial(t){this.events.onMaterialChange(t)}}const j0=14266508,hc=[3099235,8018750,3947588,9060165,4877138,11575434];class J0{constructor(){j(this,"group",new pe);j(this,"people",[]);j(this,"outdoorPaths",[]);j(this,"indoorPaths",[]);this.group.name="pedestrians",this.definePaths(),this.spawn(10)}definePaths(){this.outdoorPaths.push(dc(25,25,10)),this.outdoorPaths.push(dc(25,25,10,Math.PI)),this.outdoorPaths.push([new w(-1.2,0,11.5),new w(-1.2,0,20),new w(6,0,26),new w(14,0,30),new w(-1.2,0,20)]),this.indoorPaths.push([new w(0,0,10),new w(-6,0,7),new w(-11,0,0),new w(-6,0,-4),new w(4,0,-2),new w(6,0,6)]),this.indoorPaths.push([new w(-9,0,-1.5),new w(-2,0,2),new w(4,0,9),new w(-4,0,9),new w(-9,0,-1.5)])}spawn(t){for(let e=0;e<t;e++){const n=e%3===0,s=n?this.indoorPaths:this.outdoorPaths,r=s[e%s.length],a=.92+Math.random()*.16,o=new pe,l=new ue({color:hc[e%hc.length],roughness:.9,metalness:0}),c=new ue({color:j0,roughness:.8}),h=new Nt(new rs(.17,.42,4,8),l);h.position.y=1.18,h.castShadow=!0,o.add(h);const d=new Nt(new pr(.13,10,8),c);d.position.y=1.62,d.castShadow=!0,o.add(d);const u=new rs(.075,.55,3,6),m=new Nt(u,l);m.position.set(-.085,.62,0),m.castShadow=!0;const g=new Nt(u,l);g.position.set(.085,.62,0),g.castShadow=!0,o.add(m,g);const v=new rs(.06,.44,3,6),p=new Nt(v,l);p.position.set(-.24,1.2,0),p.castShadow=!0;const f=new Nt(v,l);f.position.set(.24,1.2,0),f.castShadow=!0,o.add(p,f),o.scale.setScalar(a),o.position.copy(r[0]),o.name=`pedestrian-${e}`,this.group.add(o),this.people.push({root:o,legs:[m,g],arms:[p,f],path:r,pathIndex:1,speed:1.1+Math.random()*.7,phase:Math.random()*Math.PI*2,inside:n})}}update(t){for(const e of this.people){const s=e.path[e.pathIndex%e.path.length].clone().sub(e.root.position);if(s.length()<.35){e.pathIndex=(e.pathIndex+1)%e.path.length;continue}s.normalize(),e.root.position.addScaledVector(s,e.speed*t);let o=Math.atan2(s.x,s.z)-e.root.rotation.y;for(;o>Math.PI;)o-=Math.PI*2;for(;o<-Math.PI;)o+=Math.PI*2;e.root.rotation.y+=o*Math.min(1,t*4),e.phase+=t*e.speed*4.2;const l=Math.sin(e.phase)*.55;e.legs[0].rotation.x=l,e.legs[1].rotation.x=-l,e.arms[0].rotation.x=-l*.8,e.arms[1].rotation.x=l*.8}}setVisible(t){this.group.visible=t}dispose(){this.people.forEach(t=>{t.root.traverse(e=>{const n=e;n.isMesh&&(n.geometry.dispose(),n.material.dispose())})}),this.people=[]}}function dc(i,t,e,n=0){const s=[];for(let r=0;r<=e;r++){const a=r/e*Math.PI*2+n;s.push(new w(Math.cos(a)*i,0,Math.sin(a)*t+2))}return s}class Q0{constructor(t){j(this,"frames",0);j(this,"acc",0);j(this,"lastReport",0);j(this,"fpsSamples",[]);j(this,"renderer");j(this,"basePixelRatio");j(this,"currentPixelRatio");j(this,"lowStreak",0);j(this,"highStreak",0);j(this,"dynamicEnabled",!0);j(this,"shadowSize",2048);j(this,"onShadowQualityChange",null);j(this,"fps",0);j(this,"minFps",999);j(this,"drawCalls",0);j(this,"triangles",0);this.renderer=t,this.basePixelRatio=Math.min(window.devicePixelRatio||1,1.75),this.currentPixelRatio=this.basePixelRatio,t.setPixelRatio(this.currentPixelRatio);const e=navigator.deviceMemory??8,n=navigator.hardwareConcurrency??4;n<=4||e<=4?this.shadowSize=1024:n<=8?this.shadowSize=2048:this.shadowSize=2048}get recommendedShadowSize(){return this.shadowSize}get pixelRatio(){return this.currentPixelRatio}get dynamic(){return this.dynamicEnabled}setDynamic(t){this.dynamicEnabled=t,t||(this.currentPixelRatio=this.basePixelRatio,this.renderer.setPixelRatio(this.currentPixelRatio))}update(t){if(this.frames++,this.acc+=t,this.acc>=.5){this.fps=this.frames/this.acc,this.fpsSamples.push(this.fps),this.fpsSamples.length>20&&this.fpsSamples.shift(),this.minFps=Math.min(...this.fpsSamples),this.frames=0,this.acc=0;const e=this.renderer.info.render;this.drawCalls=e.calls,this.triangles=e.triangles,this.dynamicEnabled&&(this.fps<45?(this.lowStreak++,this.highStreak=0,this.lowStreak>=3&&this.currentPixelRatio>.75&&(this.currentPixelRatio=Math.max(.75,this.currentPixelRatio-.15),this.renderer.setPixelRatio(this.currentPixelRatio),this.lowStreak=0)):this.fps>58?(this.highStreak++,this.lowStreak=0,this.highStreak>=6&&this.currentPixelRatio<this.basePixelRatio&&(this.currentPixelRatio=Math.min(this.basePixelRatio,this.currentPixelRatio+.1),this.renderer.setPixelRatio(this.currentPixelRatio),this.highStreak=0)):(this.lowStreak=0,this.highStreak=0))}}get stats(){return{fps:this.fps,minFps:this.minFps===999?0:this.minFps,drawCalls:this.drawCalls,triangles:this.triangles,pixelRatio:this.currentPixelRatio}}resetMin(){this.minFps=999,this.fpsSamples=[]}}const t_={marble:{name:"Mermer",css:"linear-gradient(135deg,#f2efe9,#d8d2c6)"},wood:{name:"Ahşap",css:"linear-gradient(135deg,#c79a6a,#8a6039)"},concrete:{name:"Beton",css:"linear-gradient(135deg,#d3d0ca,#a9a59d)"},fabric:{name:"Kumaş",css:"linear-gradient(135deg,#8592a0,#5c6773)"},stone:{name:"Taş",css:"linear-gradient(135deg,#a8a294,#7c766a)"},woodDark:{name:"Koyu Ahşap",css:"linear-gradient(135deg,#7a5a42,#4a3428)"}};class e_{constructor(t){j(this,"h");j(this,"doorProvider",null);j(this,"activeFloor",null);j(this,"activeApt",null);j(this,"hiddenFloors",new Set);j(this,"aptFilter","all");j(this,"toastTimer",null);this.h=t,this.buildFloors(),this.buildApartments(),this.buildLayers(),this.buildElevatorButtons(),this.bindControls(),this.bindMobileTabs()}$(t){return document.querySelector(t)}buildFloors(){const t=this.$("#floor-list");t.innerHTML="",this.$("#floor-count").textContent=String(Lt.length),[...Lt].reverse().forEach(e=>{const n=document.createElement("li"),s=document.createElement("button");s.className="floor-item",s.dataset.floor=e.id;const r=e.apartments>0?`${e.apartments} daire`:e.kind==="basement"?"Otopark":"Lobi";s.innerHTML=`
        <span class="fi-code">${e.shortName}</span>
        <span class="fi-body">
          <span class="fi-name">${e.name.split("—")[1]?.trim()??e.name}</span>
          <span class="fi-meta">${e.elevation>=0?"+":""}${e.elevation.toFixed(2)} m · ${r}</span>
        </span>
        <span class="fi-eye" data-eye="${e.id}" title="Katı göster/gizle">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/>
          </svg>
        </span>`,s.addEventListener("click",a=>{if(a.target.closest("[data-eye]")){a.stopPropagation(),this.h.onFloorToggleVisible(e.id);return}this.onFloorClick(e.id)}),n.appendChild(s),t.appendChild(n)})}onFloorClick(t){this.activeFloor=this.activeFloor===t?null:t,this.$("#btn-isolate-clear").toggleAttribute("disabled",this.activeFloor===null),document.querySelectorAll(".floor-item").forEach(e=>{e.classList.toggle("active",e.dataset.floor===this.activeFloor)}),this.h.onFloorSelect(this.activeFloor??"")}setFloorHidden(t,e){e?this.hiddenFloors.add(t):this.hiddenFloors.delete(t),document.querySelector(`[data-eye="${t}"]`)?.classList.toggle("off",e);const s=document.querySelector(`.floor-item[data-floor="${t}"]`);s&&(s.style.opacity=e?"0.45":"1")}setActiveFloorUI(t){this.activeFloor=t,this.$("#btn-isolate-clear").toggleAttribute("disabled",t===null),document.querySelectorAll(".floor-item").forEach(e=>{e.classList.toggle("active",t!==null&&e.dataset.floor===t)})}buildApartments(){const t=this.$("#apt-list");t.innerHTML="",this.$("#apt-count").textContent=String(un.length),(this.aptFilter==="all"?un:un.filter(n=>n.floorId===this.aptFilter)).forEach(n=>{const s=document.createElement("button");s.className="apt-item"+(n.id===st?" hero":""),s.dataset.apt=n.id,s.innerHTML=`<span class="apt-no">${n.no}</span><span class="apt-type">${n.type}</span><span class="apt-area">${n.area} m²</span>`,s.addEventListener("click",()=>{this.setActiveApartment(n.id),this.h.onApartmentSelect(n.id)}),t.appendChild(s)}),document.querySelectorAll("#apt-filter .chip").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll("#apt-filter .chip").forEach(s=>s.classList.remove("active")),n.classList.add("active"),this.aptFilter=n.dataset.f??"all",this.buildApartments()})})}setActiveApartment(t){this.activeApt=t,document.querySelectorAll(".apt-item").forEach(e=>{e.classList.toggle("active",e.dataset.apt===t)})}buildLayers(){const t=this.$("#layer-list");t.innerHTML="",Co.forEach(e=>{const n=document.createElement("div");n.className="layer-item off",n.dataset.layer=e.key,n.setAttribute("role","checkbox"),n.setAttribute("aria-checked","false"),n.tabIndex=0,n.innerHTML=`
        <span class="layer-swatch" style="background:${e.color}"></span>
        <span class="layer-name">${e.label}</span>
        <span class="layer-check"></span>`;const s=()=>{const r=!n.classList.contains("on");n.classList.toggle("on",r),n.classList.toggle("off",!r),n.setAttribute("aria-checked",String(r)),this.h.onLayerToggle(e.key,r)};if(n.addEventListener("click",s),n.addEventListener("keydown",r=>{(r.key==="Enter"||r.key===" ")&&(r.preventDefault(),s())}),t.appendChild(n),e.key==="structural"||e.key==="fire"){const r=document.createElement("div");r.className="layer-note",r.textContent=e.note,t.appendChild(r)}})}setLayerUI(t,e){const n=document.querySelector(`.layer-item[data-layer="${t}"]`);n?.classList.toggle("on",e),n?.classList.toggle("off",!e),n?.setAttribute("aria-checked",String(e))}buildElevatorButtons(){const t=this.$("#elev-btns");t.innerHTML="",[...Lt].reverse().forEach(e=>{const n=document.createElement("button");n.className="elev-btn",n.textContent=e.shortName,n.title=`${e.name} — asansörü çağır`,n.addEventListener("click",()=>this.h.onElevatorCall(e.index)),t.appendChild(n)})}setElevatorStatus(t,e){const n=document.querySelector("#elev-a"),s=document.querySelector("#elev-b");n&&(n.innerHTML=`A <b>${t.floor}</b>`,n.classList.toggle("moving",t.moving)),s&&(s.innerHTML=`B <b>${e.floor}</b>`,s.classList.toggle("moving",e.moving))}bindControls(){const t=this.$("#explode");t.addEventListener("input",()=>{const n=Number(t.value);this.$("#explode-value").textContent=`%${n}`,this.h.onExplodeChange(n/100)});const e=this.$("#time");e.addEventListener("input",()=>{const n=Number(e.value);this.$("#time-value").textContent=ra(n),this.h.onTimeChange(n)}),this.$("#time-value").textContent=ra(Number(e.value)),document.querySelectorAll("#weather-group .weather-btn").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll("#weather-group .weather-btn").forEach(s=>s.classList.remove("active")),n.classList.add("active"),this.h.onWeatherChange(n.dataset.w??"sunny")})}),this.$("#btn-xray").addEventListener("click",()=>this.h.onXrayToggle()),this.$("#btn-ceiling").addEventListener("click",()=>this.h.onCeilingToggle()),document.querySelectorAll(".mode-btn").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll(".mode-btn").forEach(r=>r.classList.remove("active")),n.classList.add("active");const s=n.dataset.mode??"exterior";this.setModeHint(s),this.h.onModeSelect(s)})}),this.$("#btn-reset-top").addEventListener("click",()=>this.h.onReset()),this.$("#btn-isolate-clear").addEventListener("click",()=>{this.setActiveFloorUI(null),this.h.onIsolateClear()}),this.$("#btn-cine-stop").addEventListener("click",()=>this.h.onCinematicStop()),document.querySelectorAll(".collapse-btn").forEach(n=>{n.addEventListener("click",()=>{const s=n.dataset.target,r=this.$("#app");s==="panel-left"?r.classList.toggle("left-collapsed"):r.classList.toggle("right-collapsed")})})}bindMobileTabs(){const t=document.createElement("button");t.className="mobile-tab-btn left",t.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',t.title="Katlar ve daireler",t.addEventListener("click",()=>{this.$("#panel-left").classList.toggle("open"),this.$("#panel-right").classList.remove("open")});const e=document.createElement("button");e.className="mobile-tab-btn right",e.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',e.title="Seçim bilgisi",e.addEventListener("click",()=>{this.$("#panel-right").classList.toggle("open"),this.$("#panel-left").classList.remove("open")});const n=document.createElement("div");n.className="panel-mobile-tabs",n.appendChild(t),n.appendChild(e),this.$("#app").appendChild(n)}setModeHint(t){const e={exterior:"Fare ile döndür · tekerlek ile yaklaş · sağ tık ile kaydır",interior:"WASD yürü · Shift koş · fare bak · duvarlardan geçmez",cinematic:"Kamera otomatik olarak lobi → asansör → daire → teras turunu yapar"};this.$("#mode-hint").textContent=e[t]}setModeUI(t){document.querySelectorAll(".mode-btn").forEach(e=>{e.classList.toggle("active",e.dataset.mode===t)}),this.setModeHint(t),this.$("#interior-help").toggleAttribute("hidden",t!=="interior"),this.$("#cine-bar").toggleAttribute("hidden",t!=="cinematic"),t==="interior"&&(this.$("#interior-help").innerHTML=window.innerWidth<640?"Dokunup sürükle = bak · ekranı çift dokun = kapı/ışık seç":"<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Fare</kbd> bak · <kbd>Shift</kbd> koş · <kbd>Q</kbd><kbd>E</kbd> dön · <kbd>Esc</kbd> çık")}setCinematicProgress(t){this.$("#cine-fill").style.width=`${Math.round(t*100)}%`}setXrayUI(t){this.$("#btn-xray").classList.toggle("active",t),t?document.querySelectorAll(".layer-item").forEach(e=>{e.dataset.layer!=="architectural"&&(e.classList.add("on"),e.classList.remove("off"))}):document.querySelectorAll(".layer-item").forEach(e=>{e.classList.remove("on"),e.classList.add("off")})}setCeilingUI(t,e){const n=this.$("#btn-ceiling");n.classList.toggle("active",t),n.toggleAttribute("disabled",!e)}setFps(t){const e=this.$("#fps-chip");this.$("#fps-value").textContent=t.fps.toFixed(0),e.classList.remove("warn","bad"),t.fps<40?e.classList.add("bad"):t.fps<55&&e.classList.add("warn"),this.$("#drawcall-value").textContent=`${t.drawCalls} dc · ${(t.triangles/1e3).toFixed(0)}k △ · ${t.pixelRatio.toFixed(2)}x`,e.title=`Gerçek ölçüm: ${t.fps.toFixed(1)} FPS · min ${t.minFps.toFixed(1)} FPS`}setEnergy(t,e,n){const s=Math.min(100,e/Math.max(1,n)*100),r=this.$("#energy-fill");r.style.width=`${Math.max(4,s)}%`,r.classList.toggle("high",s>70),this.$("#energy-value").textContent=`${(t/1e3).toFixed(2)} kW`,this.$("#energy-value").title=`${e}/${n} armatür açık · temsili 12 W/armatür`}renderSelection(t){const e=this.$("#inspect-body"),n=this.$("#inspect-empty"),s=this.$("#inspect-title");if(!t){e.hidden=!0,n.hidden=!1,s.textContent="Seçim";return}e.hidden=!1,n.hidden=!0;const r=t.meta,a={apartment:"DAİRE",room:"MEKÂN",door:"KAPI",light:"AYDINLATMA",window:"PENCERE",elevator:"ASANSÖR",floor:"KAT/DÖŞEME",furniture:"DONATI",material:"MALZEME",system:"TEKNİK SİSTEM"};s.textContent=a[r.kind]??"Seçim";const o=Lt.find(d=>d.id===r.floorId),l=un.find(d=>d.id===r.apartmentId);let c=`<div class="ins-badge">${a[r.kind]??"OBJE"}</div>`;c+=`<div class="ins-title">${r.label}</div>`,c+=`<div class="ins-sub">${r.id}${o?` · ${o.shortName}`:""}</div>`;const h=[];if(r.area&&h.push(["Alan",`${r.area} m²`]),r.info&&r.info.forEach(([d,u])=>h.push([d,u])),h.length>0&&(c+='<div class="ins-grid">',h.forEach(([d,u,m])=>{c+=`<div class="ins-cell${m?" wide":""}"><div class="k">${d}</div><div class="v">${u}</div></div>`}),c+="</div>"),l&&(c+='<div class="ins-section-title">Daire Bilgisi</div>',c+=`<div class="ins-grid">
        <div class="ins-cell"><div class="k">Daire No</div><div class="v">${l.no}</div></div>
        <div class="ins-cell"><div class="k">Tip</div><div class="v">${l.type}</div></div>
        <div class="ins-cell"><div class="k">Brüt</div><div class="v">${l.area} m²</div></div>
        <div class="ins-cell"><div class="k">Net</div><div class="v">${l.netArea} m²</div></div>
        <div class="ins-cell wide"><div class="k">Odalar</div><div class="v" style="font-size:10px;line-height:1.5">${l.rooms.join(" · ")}</div></div>
      </div>`),c+='<div class="ins-section-title">Etkileşimler</div><div class="ins-actions">',r.kind==="door"&&(c+='<button class="act-btn primary" data-act="door">Kapıyı Aç / Kapat</button>'),r.kind==="light"&&(c+='<button class="act-btn primary" data-act="light">Işığı Aç / Kapat</button>'),r.kind==="window"&&(c+='<button class="act-btn primary" data-act="window">Pencereyi Aç / Kapat</button>'),r.kind==="elevator"&&(c+='<button class="act-btn primary" data-act="elevate">Kat Seç ve Çağır</button>'),(r.kind==="apartment"||r.kind==="room")&&(c+='<button class="act-btn primary" data-act="focus">Odaya Odaklan</button>'),r.floorId&&(c+='<button class="act-btn" data-act="isolate">Bu Katı İzole Et</button>'),l&&(c+='<button class="act-btn" data-act="aptfocus">Daireye Git (3D)</button>'),c+='<button class="act-btn" data-act="material">Malzeme Değiştir</button>',c+="</div>",r.apartmentId===st&&this.doorProvider){const d=this.doorProvider();d.length>0&&(c+=`<div class="ins-section-title">Daire Kapıları (${d.length})</div>`,c+='<div class="ins-actions">',d.forEach(u=>{c+=`<button class="act-btn${u.open?" on":""}" data-door="${u.id}">${u.open?"● ":"○ "}${u.label}</button>`}),c+="</div>")}c+=`<div class="ins-section-title">Malzeme</div>
      <div class="mat-row mat-row-wrap">`,Object.entries(t_).forEach(([d,u])=>{c+=`<button class="mat-swatch" data-mat="${d}" title="${u.name}" style="background:${u.css}"><span>${u.name}</span></button>`}),c+="</div>",(r.layer==="structural"||r.layer==="fire")&&(c+='<div class="ins-note">Konsept gösterimdir; taşıyıcı sistem ve yangın güvenliği mevzuat uygunluğu doğrulanmamıştır.</div>'),r.kind==="apartment"&&r.apartmentId&&r.apartmentId!==st&&(c+='<div class="ins-note">Bu daire performans için temsilî donatılmıştır. Tam iç mekân örneği: <b>K1-D1 (101)</b>.</div>'),e.innerHTML=c,e.querySelector('[data-act="door"]')?.addEventListener("click",()=>this.h.onDoorToggle(r.id)),e.querySelector('[data-act="light"]')?.addEventListener("click",()=>{this.h.onLightToggle(r.id)}),e.querySelector('[data-act="window"]')?.addEventListener("click",()=>this.toast("Pencere durumu değiştirildi")),e.querySelector('[data-act="elevate"]')?.addEventListener("click",()=>{const d=Lt.find(u=>u.id===r.floorId);d?this.h.onElevatorCall(d.index):this.h.onElevatorCall(0)}),e.querySelector('[data-act="focus"]')?.addEventListener("click",()=>{r.apartmentId&&this.h.onFocusApartment(r.apartmentId)}),e.querySelector('[data-act="aptfocus"]')?.addEventListener("click",()=>{l&&this.h.onFocusApartment(l.id)}),e.querySelector('[data-act="isolate"]')?.addEventListener("click",()=>{r.floorId&&this.h.onIsolateFloor(r.floorId)}),e.querySelectorAll("[data-door]").forEach(d=>{d.addEventListener("click",()=>{this.h.onDoorToggle(d.dataset.door)})}),e.querySelectorAll("[data-mat]").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll("[data-mat]").forEach(u=>u.classList.remove("active")),d.classList.add("active"),this.h.onMaterialSelect(d.dataset.mat??"marble")})})}renderAparmentInfo(t){const e={meta:{kind:"apartment",id:t.id,label:`${t.no} — ${t.type}`,floorId:t.floorId,apartmentId:t.id,area:t.area},object:null,worldPos:null};this.renderSelection(e)}toast(t){const e=this.$("#toast");e.textContent=t,e.classList.add("show"),this.toastTimer&&window.clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>e.classList.remove("show"),2400)}setLoading(t,e){this.$("#loading-fill").style.width=`${Math.round(t*100)}%`,e&&(this.$("#loading-step").textContent=e)}finishLoading(){this.setLoading(1,"Hazır"),setTimeout(()=>this.$("#loading").classList.add("done"),260)}setTimeUI(t){this.$("#time").value=String(t),this.$("#time-value").textContent=ra(t)}setExplodeUI(t){const e=this.$("#explode");e.value=String(Math.round(t*100)),this.$("#explode-value").textContent=`%${Math.round(t*100)}`}setElevatorButtonsCurrent(t){document.querySelectorAll(".elev-btn").forEach((e,n)=>{const s=Lt.length-1-n;e.classList.toggle("current",Lt[s]?.index===t)})}}function ra(i){const t=Math.floor((i%24+24)%24),e=Math.round((i-Math.floor(i))*60);return`${String(t).padStart(2,"0")}:${String(e===60?0:e).padStart(2,"0")}`}const Rn=document.getElementById("viewport"),n_=document.getElementById("scene"),De=new dg({canvas:n_,antialias:!0,powerPreference:"high-performance",alpha:!1});De.setSize(Rn.clientWidth,Rn.clientHeight,!1);De.shadowMap.enabled=!0;De.shadowMap.type=mc;De.toneMapping=so;De.toneMappingExposure=1.05;De.outputColorSpace=en;De.info.autoReset=!1;const Ze=new vo;Ze.fog=new fr(11059408,120,340);const ki=new Q0(De),mn=new U0(Ze,De);mn.setHour(17.5);const Ut=new C0;Ze.add(Ut.root);const i_=P0();Ze.add(i_);const lh=new J0;Ze.add(lh.group);const qt=new q0(De,Rn);qt.setColliders(Ut.colliders.map(i=>({minX:i.min.x,maxX:i.max.x,minZ:i.min.z,maxZ:i.max.z,minY:i.min.y,maxY:i.max.y})));Ze.add(qt.camera);const Gi=new Vg(De);Gi.addPass(new Wg(Ze,qt.camera));const Lo=new Oi(new tt(Rn.clientWidth,Rn.clientHeight),.42,.85,.86);Gi.addPass(Lo);Gi.addPass(new Kg);Gi.setSize(Rn.clientWidth,Rn.clientHeight);const fe={xrayOn:!1,ceilingsHidden:!1,exploded:0,selectedDoorIds:new Set,lastMode:"exterior"};let cn;const wt=new e_({onFloorSelect:i=>{if(!i){Ut.setIsolate(null),wt.setCeilingUI(fe.ceilingsHidden,!1),fe.ceilingsHidden&&(fe.ceilingsHidden=!1,Ut.setCeilingsHidden(!1)),qt.focusOn(new w(0,9,0),62);return}to(i)},onFloorToggleVisible:i=>{const t=Ut.floors.get(i);t&&(t.group.visible=!t.group.visible,wt.setFloorHidden(i,!t.group.visible),wt.toast(`${i} katı ${t.group.visible?"gösterildi":"gizlendi"}`))},onApartmentSelect:i=>uc(i),onIsolateClear:()=>{Ut.setIsolate(null),fe.ceilingsHidden=!1,Ut.setCeilingsHidden(!1),wt.setCeilingUI(!1,!1),wt.setActiveFloorUI(null),qt.focusOn(new w(0,9,0),62)},onLayerToggle:(i,t)=>{!fe.xrayOn&&t&&no(!0),Ut.xray.toggleLayer(i,t)},onModeSelect:i=>eo(i),onExplodeChange:i=>{fe.exploded=i,Ut.setExplode(i)},onTimeChange:i=>{mn.setHour(i),a_(i)},onWeatherChange:i=>{mn.setWeather(i),Ze.fog.color.copy(i==="sunny"?new ot(10467528):new ot(8951200)),wt.toast(i==="sunny"?"Hava: Güneşli":i==="rain"?"Hava: Yağmurlu":"Hava: Karlı")},onXrayToggle:()=>no(!fe.xrayOn),onCeilingToggle:()=>{fe.ceilingsHidden=!fe.ceilingsHidden,Ut.setCeilingsHidden(fe.ceilingsHidden),wt.setCeilingUI(fe.ceilingsHidden,Ut.isolatedFloor!==null),wt.toast(fe.ceilingsHidden?"Tavanlar gizlendi — üstten inceleme":"Tavanlar görünür")},onElevatorCall:i=>{const t=Ut.core.cars[0],e=t.calls.length===1&&Ut.core.cars[1].calls.length===0?Ut.core.cars[1]:t;Ut.core.call(e.id,i);const n=Lt.find(s=>s.index===i);wt.toast(`Asansör ${e.id} → ${n?.shortName??i} çağrıldı`)},onReset:()=>o_(),onDoorToggle:i=>cn.toggleDoor(i),onLightToggle:i=>{const t=Ut.heroLights.find(e=>i.includes(e.id)||e.id.endsWith(i.split("-").slice(-1)[0]));t&&(cn.setLight(t.id,!t.on),Vi(),wt.toast(`${t.room}: ışık ${t.on?"açık":"kapalı"}`))},onMaterialSelect:i=>r_(i),onFocusApartment:i=>uc(i),onIsolateFloor:i=>to(i),onCinematicStop:()=>eo("exterior")});wt.doorProvider=()=>Ut.heroDoors.map(i=>({id:i.id,label:i.label,open:i.open}));cn=new Z0(Ut,qt.camera,De.domElement,{onSelect:i=>{wt.renderSelection(i),i&&window.innerWidth<=940&&document.getElementById("panel-right")?.classList.add("open")},onFloorPick:i=>{wt.setActiveFloorUI(i),to(i)},onToast:i=>wt.toast(i),onLightChange:()=>Vi(),onDoorChange:(i,t)=>{t?fe.selectedDoorIds.add(i):fe.selectedDoorIds.delete(i)},onElevatorChange:()=>{},onWindowChange:()=>{},onMaterialChange:()=>{}});qt.onModeChange=i=>{fe.lastMode=i,wt.setModeUI(i),cn.setEnabled(i!=="cinematic")};new vo;function to(i){Ut.setIsolate(i),wt.setActiveFloorUI(i);const t=Lt.find(s=>s.id===i);if(!t)return;fe.ceilingsHidden||(fe.ceilingsHidden=!0,Ut.setCeilingsHidden(!0)),wt.setCeilingUI(fe.ceilingsHidden,!0);const e=t.elevation+Ut.explodeValue*(t.kind==="basement"?-7.5*.55:t.index*7.5),n=new w(0,e+1.2,0);qt.focusOn(n,42),qt.controls.target.copy(n),qt.camera.position.set(26,e+26,34),qt.controls.update(),wt.toast(`${t.name} izole edildi — diğer katlar gizli`)}function uc(i){const t=un.find(a=>a.id===i);if(!t)return;const e=us[t.quadrant],n=Lt.find(a=>a.id===t.floorId);if(!n)return;Ut.setIsolate(t.floorId),wt.setActiveFloorUI(t.floorId);const s=n.kind==="basement"?-7.5*.55*Ut.explodeValue:n.index*7.5*Ut.explodeValue,r=n.elevation+s;if(wt.setActiveApartment(i),wt.renderAparmentInfo(t),wt.toast(`${t.no} — ${t.type} · ${t.area} m²`),i===st){fe.ceilingsHidden=!0,Ut.setCeilingsHidden(!0),wt.setCeilingUI(!0,!0);const a=new w(e.x,r+1,e.z);qt.focusOn(a,18),qt.controls.target.copy(a),qt.camera.position.set(e.x+2,r+14,e.z+12),qt.controls.update()}else if(t.floorId==="K5"){const a=new w(e.x,r+2,e.z);qt.focusOn(a,30)}else{const a=new w(e.x,r+1.2,e.z);qt.focusOn(a,34),qt.controls.target.copy(a),qt.camera.position.set(e.x+6,r+20,e.z+26),qt.controls.update()}}function eo(i){if(i==="exterior"&&(Ut.setIsolate(null),wt.setActiveFloorUI(null)),qt.setMode(i),wt.setModeUI(i),cn.setEnabled(i!=="cinematic"),i==="interior"){const t=Ut.isolatedFloor??"Z";Ut.setIsolate(t),wt.setActiveFloorUI(t),Ut.setCeilingsHidden(!1),qt.setInteriorStart(t),wt.toast("İç mekân modu — WASD ile yürüyün, duvarlardan geçmezsiniz"),window.innerWidth<=940&&(document.getElementById("panel-left")?.classList.remove("open"),document.getElementById("panel-right")?.classList.remove("open"))}else i==="cinematic"&&wt.toast("Sinematik tur başladı — dış cephe → lobi → asansör → daire → teras")}function no(i){fe.xrayOn=i,Ut.xray.setEnabled(i),wt.setXrayUI(i),i?(wt.toast("X-RAY: teknik sistemler açık (kavramsal gösterim)"),Ze.fog=null):(wt.toast("X-RAY kapalı — mimari görünüm"),Ze.fog=new fr(11059408,120,340),Co.forEach(t=>wt.setLayerUI(t.key,!1)))}const s_={marble:"marble",wood:"wood",concrete:"concrete",fabric:"fabric",stone:"stone",woodDark:"woodDark"};function r_(i){const t=cn.selection;if(!t){wt.toast("Önce bir yüzey seçin");return}const e=t.object,n=s_[i]??i,s=rn(n);if(e.material instanceof Wn){const r=s.clone();r.transparent=!1,e.material.dispose?.(),e.material=r,wt.toast(`Malzeme değişti: ${i}`)}}function Vi(){const i=Ut.lightStats(),e=i.watts+420;wt.setEnergy(e,i.on,i.on+i.off)}function a_(i){i<6.5||i>18.2?Ut.heroLights.forEach(e=>{!e.on&&e.room!=="Balkon"&&cn.setLight(e.id,!0)}):i>7&&i<17&&Ut.heroLights.forEach(e=>{!(e.id.includes("salon")||e.id.includes("mutfak"))&&e.on&&cn.setLight(e.id,!1)}),Vi()}function o_(){fe.exploded=0,Ut.setExplode(0),wt.setExplodeUI(0),Ut.setIsolate(null),wt.setActiveFloorUI(null),fe.ceilingsHidden=!1,Ut.setCeilingsHidden(!1),wt.setCeilingUI(!1,!1),Ut.floors.forEach((i,t)=>{i.group.visible=!0,wt.setFloorHidden(t,!1)}),Ut.heroDoors.forEach(i=>{i.open=!1,i.targetAngle=0}),Ut.heroLights.forEach(i=>cn.setLight(i.id,i.room!=="Balkon")),fe.xrayOn&&no(!1),Ut.core.reset(),qt.reset(),wt.setModeUI("exterior"),mn.setHour(17.5),mn.setWeather("sunny"),wt.setTimeUI(17.5),document.querySelectorAll("#weather-group .weather-btn").forEach(i=>{i.classList.toggle("active",i.dataset.w==="sunny")}),cn.clearSelection(),wt.setActiveApartment(null),Vi(),wt.toast("Sahne başlangıç durumuna döndürüldü"),ki.resetMin()}function Do(){const i=Rn.clientWidth,t=Rn.clientHeight;i===0||t===0||(qt.camera.aspect=i/t,qt.camera.updateProjectionMatrix(),qt.resize(),De.setSize(i,t,!1),Gi.setSize(i,t),Lo.setSize(i,t))}window.addEventListener("resize",Do);window.addEventListener("orientationchange",()=>setTimeout(Do,120));const l_=new nh;let aa=0;function ch(){requestAnimationFrame(ch);const i=Math.min(l_.getDelta(),.06);if(qt.update(i),Ut.updateDoors(i),Ut.core.update(i),mn.update(i),lh.update(i),ki.update(i),qt.mode==="cinematic"&&(wt.setCinematicProgress(qt.cinematicProgress),!qt.cinematicPlaying&&qt.cinematicProgress>=1&&eo("exterior")),Lo.strength=.32+mn.interiorLightFactor*.55,De.info.reset(),Gi.render(),aa++,aa%12===0){wt.setFps(ki.stats);const t=Ut.core.cars;wt.setElevatorStatus({floor:fc(t[0].currentFloor),moving:t[0].dir!==0},{floor:fc(t[1].currentFloor),moving:t[1].dir!==0}),wt.setElevatorButtonsCurrent(t[0].currentFloor)}aa%60===0&&Vi()}function fc(i){return Lt.find(t=>t.index===i)?.shortName??"Z"}wt.setLoading(.2,"Kütüphane hazır");requestAnimationFrame(()=>{wt.setLoading(.55,"Bina geometrisi oluşturuluyor"),requestAnimationFrame(()=>{wt.setLoading(.85,"Gölgeler ve materyaller"),mn.setShadowQuality(ki.recommendedShadowSize),mn.apply(),Vi(),Do(),ch(),setTimeout(()=>{wt.finishLoading(),wt.toast("Hazır — bir nesneye tıklayın veya kat seçin")},450)})});window.__NUMEX__={scene:Ze,renderer:De,building:Ut,camController:qt,atmosphere:mn,perf:ki,interaction:cn,ui:wt,stats:()=>({meshes:c_(Ze),floors:Lt.length,apartments:un.length,fps:ki.stats})};function c_(i){let t=0;return i.traverse(e=>{e.isMesh&&t++}),t}
