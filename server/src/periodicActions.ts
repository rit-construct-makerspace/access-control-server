import { knex } from "./db/index.js";
import { listObjects } from "./integrations/aws/s3.js"
import { send_generic_email } from "./integrations/email/email.js";

/**
 * If you use the CDN to store user-uploads, make sure you update this query so it knows that those images are in use
 */
export async function purge_images(): Promise<void> {
	// This is so embarassing, S3 configuration is a terrible test that we absolutely failed
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

		const inUse = new Set(inUseArr);
		const storedArr = await listObjects("user-uploads");
		if (!storedArr) {
			console.error("Couldn't list user-uploads to prune");
			return;
		}

		// All that is stored minus all that are in use
		const toDelete = storedArr.filter(key => !inUse.has(key));
		const msg = `Please Delete ${toDelete.length} unused objects in the user-uploads/ folder:\n- ${toDelete.join("\n- ")}`;
		
		if (!process.env.AWS_DELETER_EMAIL) {
			console.log("NO MANAGEMENT RECEIPIENT, TELL SOMEONE THE FOLLOWING\n", msg)
			return;
		}

		await send_generic_email({
			fromAccount: "management",
			to: [process.env.AWS_DELETER_EMAIL],
			htmlContent: `<pre>${msg}</pre>`,
			textContent: msg,
			subject: "You need to delete some images"
		})
	} catch (e) {
		console.error("Could not purge images: ", e);
	}
}