import { HiddenItem } from "./types";

export interface HideItems {
	addFile(name: string, callback: () => void): void;
	addFolder(name: string, callback: () => void): void;

	removeFile(name: string, callback: () => void): void;
	removeFolder(name: string, callback: () => void): void;

	changeFileHidden(name: string, hidden: boolean, callback: () => void): void;
	changeFolderHidden(name: string, hidden: boolean, callback: () => void): void;

	getHiddenFiles(): HiddenItem[];
	getHiddenFolders(): HiddenItem[];

	getAllFileNames(): string[];
	getAllFolderNames(): string[];
}
