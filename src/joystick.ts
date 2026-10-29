/** Pointer ownership is independent of capture, which can be lost on mobile overlays. */
export class StickGesture {
 id:number|null=null;
 begin(id:number){if(this.id!==null)return false;this.id=id;return true;}
 owns(id:number){return this.id===id;}
 end(id?:number){if(id!==undefined&&!this.owns(id))return false;this.id=null;return true;}
}
export function bindJoystick(stick:HTMLElement,knob:HTMLElement,move:(x:number,y:number)=>void,enabled:()=>boolean){
 const gesture=new StickGesture(),doc=stick.ownerDocument,win=doc.defaultView!;
 const reset=(id?:number)=>{const old=gesture.id;if(!gesture.end(id))return;knob.style.transform='';move(0,0);if(old!==null&&stick.hasPointerCapture(old))stick.releasePointerCapture(old);};
 const set=(e:PointerEvent)=>{const r=stick.getBoundingClientRect(),radius=r.width*.27;if(!r.width)return;let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;const length=Math.max(1,Math.hypot(x,y));x/=length;y/=length;knob.style.transform=`translate(${Math.round(x*radius)}px,${Math.round(y*radius)}px)`;move(x,y);};
 const down=(e:PointerEvent)=>{if(!enabled()||(e.pointerType==='mouse'&&e.button!==0))return;if(e.pointerType==='mouse')reset();if(!gesture.begin(e.pointerId))return;e.preventDefault();e.stopPropagation();try{stick.setPointerCapture(e.pointerId)}catch{/* Window listeners retain drag ownership if capture is unavailable. */}set(e);};
 const drag=(e:PointerEvent)=>{if(!gesture.owns(e.pointerId))return;if(!enabled()||(e.pointerType==='mouse'&&e.buttons===0)){reset(e.pointerId);return}e.preventDefault();e.stopPropagation();set(e);};
 const end=(e:PointerEvent)=>{if(!gesture.owns(e.pointerId))return;e.preventDefault();e.stopPropagation();reset(e.pointerId);};
 const lost=(e:PointerEvent)=>reset(e.pointerId),blur=()=>reset(),visibility=()=>{if(doc.hidden)reset()};
 stick.addEventListener('pointerdown',down,{passive:false});
 win.addEventListener('pointermove',drag,{passive:false,capture:true});
 win.addEventListener('pointerup',end,{passive:false,capture:true});
 win.addEventListener('pointercancel',end,{passive:false,capture:true});
 stick.addEventListener('lostpointercapture',lost);win.addEventListener('blur',blur);doc.addEventListener('visibilitychange',visibility);
 return {reset,dispose(){reset();stick.removeEventListener('pointerdown',down);win.removeEventListener('pointermove',drag,true);win.removeEventListener('pointerup',end,true);win.removeEventListener('pointercancel',end,true);stick.removeEventListener('lostpointercapture',lost);win.removeEventListener('blur',blur);doc.removeEventListener('visibilitychange',visibility);}};
}
