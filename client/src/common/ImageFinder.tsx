/**
 * Makes a url for a CDN image
 * @param image the name of the image file to be used, usually stored in the db as imageurl
 * @param path folder that the image resides in
 * @returns the entire url for the requested image as a string 
 */
export function makeCDNLink(image: string|undefined|null, path= ""){
    const result = import.meta.env.VITE_CDN_URL + path + image
    return (image && image !== "") ? result : import.meta.env.BASE_URL + "/shed_acronym_vert.jpg"
}
