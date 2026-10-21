export function validatePaymentProof(p:{txnId:string;amount:number}){return p.txnId.trim().length>=6&&p.amount>0}
