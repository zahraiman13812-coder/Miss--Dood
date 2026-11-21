import ProductEditor from "@/features/dashboard/ProductEditor";
export default async function EditProduct({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <ProductEditor mode="edit" slug={slug}/>}
