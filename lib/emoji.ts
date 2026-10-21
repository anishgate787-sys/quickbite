const foods:Record<string,string>={vada:'🥙',pav:'🥙',samosa:'🥟',misal:'🍛',biryani:'🍚',dosa:'🥞',idli:'⚪',poha:'🍚',upma:'🥣',paratha:'🫓',thali:'🍱',bhaji:'🍲',chai:'🍵',tea:'🍵',coffee:'🧋',lassi:'🥛',maggi:'🍜',noodle:'🍜',sandwich:'🥪',burger:'🍔',pizza:'🍕',roll:'🌯',momos:'🥟',fries:'🍟',juice:'🧃',shake:'🥤',egg:'🍳',rice:'🍚',dal:'🍲',paneer:'🧀',cake:'🍰',cookie:'🍪',salad:'🥗',fruit:'🍎',water:'💧',cold:'🥤',pakoda:'🧆',kebab:'🍢',tandoori:'🍗',roti:'🫓',uttapam:'🥞',puri:'🫓',sabudana:'🍚',rasgulla:'🍡',gulab:'🍩'};
export function emojiFor(name:string){const n=name.toLowerCase();const key=Object.keys(foods).find(k=>n.includes(k));return key?foods[key]:'🍽️'}
export const emojiOptions=Object.values(foods).filter((v,i,a)=>a.indexOf(v)===i);
export function foodImage(name:string){
  // Offline-friendly visual fallback. Replace with a Storage image URL later.
  return emojiFor(name);
}
