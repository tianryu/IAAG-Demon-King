// Icons are individual frames from the generated transparent UI atlas.
export function icon(name:string,extra=''){return `<span class="pixel-icon ${extra}" style="--icon-image:var(--icons-${name})" aria-hidden="true"></span>`;}
export const buffIcon:Record<string,string>={count:'goblin',attack:'sword',health:'heart',haste:'haste',income:'coin',armor:'shield',range:'bow',splash:'burst',regen:'plus',slow:'snow'};
export const compact=(n:number)=>n>=1e9?`${(n/1e9).toFixed(1)}B`:n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=10000?`${(n/1000).toFixed(1)}k`:String(Math.floor(n));
