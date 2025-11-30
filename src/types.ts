export type HiddenItem = {
	name: string;
	hidden: boolean;
}

export type HideFileSettings = {
	hiddenFiles: HiddenItem[];
    hiddenFolders: HiddenItem[];
}
