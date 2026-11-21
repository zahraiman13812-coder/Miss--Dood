export async function register(){ /* Server instrumentation hook available for future tracing providers. */ }
export async function onRequestError(error:unknown,request:{path:string},context:{routePath:string}){
 try{
  const {recordOperationError}=await import("@/lib/operations");
  await recordOperationError(`request:${(context.routePath||request.path||"unknown").slice(0,70)}`,error);
 }catch{ /* Instrumentation must never break response rendering. */ }
}
