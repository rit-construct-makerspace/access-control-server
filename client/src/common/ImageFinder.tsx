export function findImage(image: string|undefined|null){
    const result = import.meta.env.VITE_CDN_URL + "user-uploads/" + image
    return (image && image !== "") ? result : import.meta.env.BASE_URL + "/shed_acronym_vert.jpg"
}
