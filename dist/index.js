import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import DefaultOptions from "./DefaultOptions.js";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { utimes } from "utimes";
export default async (inputFilePath, metadata, outputFilePath, options) => {
    const opt = { ...DefaultOptions, ...options };
    const args = ["-i"];
    const coverPicturePath = metadata.coverPicturePath ? metadata.coverPicturePath : "";
    let ffmpegFileOutputPath = outputFilePath ?? "";
    if (!fs.existsSync(inputFilePath)) {
        throw new Error(`${inputFilePath}: file does not exist`);
    }
    if (!outputFilePath) {
        outputFilePath = inputFilePath;
        ffmpegFileOutputPath = inputFilePath;
    }
    if (fs.existsSync(outputFilePath)) {
        if (path.normalize(inputFilePath).toLowerCase() === path.normalize(outputFilePath).toLowerCase()) {
            const parsed = path.parse(outputFilePath);
            ffmpegFileOutputPath = path.join(parsed.dir, `${parsed.name}-${uuid()}${parsed.ext}`);
        }
        else {
            throw new Error(`${outputFilePath}: file already exists`);
        }
    }
    if (opt.debug) {
        console.debug("filePath:", inputFilePath);
        console.debug("outputFilePath:", outputFilePath);
        if (ffmpegFileOutputPath !== outputFilePath) {
            console.debug("ffmpegFileOutputPath", ffmpegFileOutputPath);
        }
        console.debug("metadata:", metadata);
        console.debug("Applied Options:", opt);
    }
    args.push(`"${inputFilePath}"`);
    if (coverPicturePath) {
        args.push("-i", `"${coverPicturePath}"`);
    }
    if (coverPicturePath) {
        args.push("-map", "0:0");
        args.push("-map", "1");
    }
    args.push("-c", "copy");
    if (coverPicturePath) {
        args.push("-disposition:v:0", "attached_pic");
    }
    addMetaData(args, "album", metadata.album);
    addMetaData(args, "artist", metadata.artist);
    addMetaData(args, "album_artist", metadata.albumArtist);
    addMetaData(args, "grouping", metadata.grouping);
    addMetaData(args, "composer", metadata.composer);
    addMetaData(args, "date", metadata.year);
    addMetaData(args, "track", metadata.trackNumber);
    addMetaData(args, "comment", metadata.comment);
    addMetaData(args, "genre", metadata.genre);
    addMetaData(args, "copyright", metadata.copyright);
    addMetaData(args, "description", metadata.description);
    addMetaData(args, "synopsis", metadata.synopsis);
    addMetaData(args, "lyrics", metadata.lyrics);
    addMetaData(args, "title", metadata.title);
    args.push(`"${ffmpegFileOutputPath}"`);
    if (opt.debug) {
        console.debug(`Running command ${ffmpegPath} ${args.join(" ")}`);
    }
    const ffmpeg = spawn(ffmpegPath ?? "", args, { windowsVerbatimArguments: true, stdio: opt.pipeStdio ? ["pipe", process.stdout, process.stderr] : undefined, detached: false, shell: process.platform !== "win32" });
    await onExit(ffmpeg);
    if (opt.debug) {
        console.debug(`Created file ${ffmpegFileOutputPath}`);
    }
    const inputFileStats = fs.statSync(inputFilePath);
    const btime = Math.round(inputFileStats.birthtimeMs);
    const atime = Math.round(inputFileStats.atimeMs);
    const mtime = Math.round(inputFileStats.mtimeMs);
    if (opt.debug) {
        console.debug(`Setting ${ffmpegFileOutputPath} creation date: ${new Date(btime)} (${btime}), accessed date: ${new Date(atime)} (${atime}), modified date: ${new Date(atime)} (${atime}) so it matches with the original file`);
    }
    await utimes(ffmpegFileOutputPath, { btime, atime, mtime });
    if (ffmpegFileOutputPath !== outputFilePath) {
        if (opt.debug) {
            console.debug(`Deleting ${outputFilePath}`);
        }
        fs.unlinkSync(outputFilePath);
        if (opt.debug) {
            console.debug(`Renaming ${ffmpegFileOutputPath} to ${outputFilePath}`);
        }
        fs.renameSync(ffmpegFileOutputPath, outputFilePath);
    }
};
function addMetaData(args, key, value) {
    if (value !== undefined) {
        let arg = value;
        if (process.platform !== "win32") {
            arg = `'${arg.toString().replace(/'/g, "'\\''")}'`;
        }
        else {
            arg = `"${arg.toString().replace(/"/g, "\\\"")}"`;
        }
        args.push("-metadata", `${key}=${arg}`);
    }
}
function onExit(childProcess) {
    return new Promise((resolve, reject) => {
        childProcess.once("exit", code => {
            if (code === 0) {
                resolve(undefined);
            }
            else {
                reject(new Error("Exit with error code: " + code));
            }
        });
        childProcess.once("error", (err) => {
            reject(err);
        });
    });
}
