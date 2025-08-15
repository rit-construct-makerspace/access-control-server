import { knex } from "./db/index.js";
import { listObjects, deleteObjects } from "./integrations/aws/s3.js"


export async function purge_images() {
	try {
		const inUseImages = await knex.raw(`
	    with images(id) as (
		    with entries(item) as (
		    	select  json_array_elements("quiz"::json) as item from "TrainingModule" tm 
		    ) select replace(cast(item::json->'text' as text), '"', '') as image from entries where cast(item::json->'type' as text) = '"IMAGE_EMBED"'
		    union
		    select z."imageUrl" as image from "Zones" z 
		    union 
		    select e."imageUrl" as image from "Equipment" e 
		    union 
		    select i."image" as image from "InventoryItem" i
		    union 
		    select t."imageUrl" as image from "ToolItemTypes" t
	    ) select id from images where id is not null and length(id) > 0`);
		const inUseArr = inUseImages?.rows?.map((o: { id: string }) => o.id);
		console.log(inUseArr);
		const inUse = new Set(inUseArr);
		const storedArr = await listObjects("user-uploads");
		console.log("stored", storedArr);
		// All that is stored minus all that is in use
		// const toDelete = storedArr.filter(key => inUse.has(key));
		// console.log(`Deleting ${toDelete.length} unused objects`, toDelete);

		// const deleted = await deleteObjects(toDelete)
		// console.log(`Purged ${deleted.length} images. ${inUseArr.length} remain`)
	} catch (e) {
		console.error("Could not purge images: ", e);
	}
}