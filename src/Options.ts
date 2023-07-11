export default interface Options {
   /**
    * Remove existing metadata?
    * @default false
    */
   clear?: boolean,
   /**
    * Write debugging output to the console?
    * @default false
    */
   debug?: boolean,
   /**
    * If stdio should be piped to the current console, useful for figuring out issues with ffmpeg
    * @default false
    */
   pipeStdio?: boolean,
}
