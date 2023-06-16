export default interface Metadata {
   title?: string,
   artist?: string,
   albumArtist?: string,
   album?: string,
   grouping?: string,
   composer?: string,
   year?: number,
   trackNumber?: number,
   comment?: string,
   genre?: string,
   copyright?: string,
   description?: string,
   synopsis?: string,
   lyrics?: string,
   /**
    * The path for the cover photo that should be added to the file
    */
   coverPicturePath?: string,
}
