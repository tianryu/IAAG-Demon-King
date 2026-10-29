import {initialSave,parseSave,type Save} from './model.ts';
const key='goblin-overlord-v1';
export function load():{save:Save;warning?:string}{
 try{const raw=localStorage.getItem(key);if(!raw)return {save:initialSave()};try{return {save:parseSave(raw)}}catch{
 localStorage.setItem(key+'-damaged-'+Date.now(),raw);const backup=localStorage.getItem(key+'-backup');if(backup){try{return {save:parseSave(backup),warning:'已恢复备份存档'}}catch{}}
 return {save:initialSave(),warning:'存档损坏，原文件已备份'};
 }}catch{return {save:initialSave(),warning:'存储不可用，关闭页面将丢失进度'}}
}
export function persist(save:Save):boolean{try{const raw=JSON.stringify(save);parseSave(raw);localStorage.setItem(key+'-backup',localStorage.getItem(key)||raw);localStorage.setItem(key,raw);return true}catch{return false}}
