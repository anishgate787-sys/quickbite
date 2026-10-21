export const slots=Array.from({length:10},(_,i)=>`${12+Math.floor(i/6)}:${String((i%6)*10).padStart(2,'0')} PM`);
export function spotsLeft(capacity:number,orders:{slot_time:string,status:string}[],slot:string){return Math.max(0,capacity-orders.filter(o=>o.slot_time===slot&&o.status!=='rejected').length)}
