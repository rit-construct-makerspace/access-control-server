export function findImage(image: string|undefined|null, path= ""){
    const result = import.meta.env.VITE_CDN_URL + path + image
    return (image && image !== "") ? result : import.meta.env.BASE_URL + "/shed_acronym_vert.jpg"
}
