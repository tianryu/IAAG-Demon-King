export type AdResult='completed'|'cancelled'|'unavailable'|'failed';
export interface AdProvider{available():boolean;show():Promise<AdResult>}
/** Installed only after MCP verifies the selected application's live ad configuration. */
export class RewardAds{
 private busy=false;private used=new Set<string>();
 private provider?:AdProvider;
 private timeoutMs:number;
 constructor(provider?:AdProvider,timeoutMs=120000){this.provider=provider;this.timeoutMs=timeoutMs;}
 available(){return !!this.provider?.available()&&!this.busy;}
 async watch(transaction:string,grant:()=>void):Promise<AdResult>{
  if(this.busy||this.used.has(transaction)||!this.provider?.available())return 'unavailable';
  this.busy=true;
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{const timeout=new Promise<AdResult>(resolve=>{timer=setTimeout(()=>resolve('failed'),this.timeoutMs);});const result=await Promise.race([this.provider.show(),timeout]);if(result==='completed'&&!this.used.has(transaction)){this.used.add(transaction);grant();}return result;}catch{return 'failed'}finally{clearTimeout(timer);this.busy=false;}
 }
}
