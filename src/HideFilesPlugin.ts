import { Notice, Plugin, TFile, TFolder, View } from "obsidian";
import HideFilesSettingTab from "./HideFilesSettingTab";
import { HiddenItem, HideFileSettings } from "./types";
import { HideItems } from "./HideItems";

const DEFAULT_SETTINGS: HideFileSettings = {
	hiddenFiles: [],
	hiddenFolders: [],
};

export default class HideFilesPlugin extends Plugin implements HideItems {
	settings: HideFileSettings | null = null;
	fileExplorerView: View | null = null;

	public async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);

		this.addSettingTab(new HideFilesSettingTab(this.app, this, this));

		this.registerEvent(
			this.app.workspace.on("file-menu", () => this.updateFileExplorer())
		);
		this.registerEvent(
			this.app.vault.on("rename", () => this.updateFileExplorer())
		);
		this.registerEvent(
			this.app.vault.on("create", () => this.updateFileExplorer())
		);
		this.registerEvent(
			this.app.vault.on("delete", () => this.updateFileExplorer())
		);
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.initFileExplorerView();
				this.updateFileExplorer();
			})
		);
		
		this.app.workspace.onLayoutReady(() => {
			this.initFileExplorerView();
			this.updateFileExplorer();
		});
	}

	public onunload() {
		this.settings = null;
		this.updateFileExplorer();
	}
	
	public async saveAndApplySettings() {
		await this.saveData(this.settings);
		this.updateFileExplorer();
	}

	private initFileExplorerView() {
		const fileExplorer = this.app.workspace.getLeavesOfType("file-explorer")[0];
		this.fileExplorerView = fileExplorer?.view;
	}

	private updateFileExplorer() {
		const fileItems = this.getFileExplorerItems();

		for (const key in fileItems) {
			const item = fileItems[key];

			if (!item.file) {
				continue;
			}

			const itemName = item.file.name;
			const isFolder = item.file instanceof TFolder;

			const hiddenItems = isFolder
				? this.settings?.hiddenFolders
				: this.settings?.hiddenFiles;

			const hiddenItem = hiddenItems?.find(
				(file) => file.name === itemName
			);

			item.el.style.display = hiddenItem?.hidden ? "none" : "";
		}
	}

	public addFile(name: string, callback: () => void) {
		HideFilesPlugin.addItem(name, callback, this.getHiddenFiles());
		this.saveAndApplySettings();
	}

	public addFolder(name: string, callback: () => void) {
		HideFilesPlugin.addItem(name, callback, this.getHiddenFolders());
		this.saveAndApplySettings();
	}

	private static addItem(
		name: string,
		callback: () => void,
		hiddenItems: HiddenItem[]
	) {
		if (name.length === 0) {
			new Notice("Item name is empty.");
			return;
		}

		const foundItem = hiddenItems.find((item) => item.name === name);
		if (foundItem) {
			new Notice(`Item with name "${name}" already exists.`);
			return;
		}

		const newHiddenItem: HiddenItem = {
			name,
			hidden: true,
		};
		hiddenItems.push(newHiddenItem);
		callback();
	}

	public removeFile(name: string, callback: () => void) {
		if (!this.settings) {
			return;
		}

		this.settings.hiddenFiles = this.settings.hiddenFiles.filter(
			(item) => item.name !== name
		);

		this.saveAndApplySettings();
		callback();
	}

	public removeFolder(name: string, callback: () => void) {
		if (!this.settings) {
			return;
		}

		this.settings.hiddenFolders = this.settings.hiddenFolders.filter(
			(item) => item.name !== name
		);

		this.saveAndApplySettings();
		callback();
	}

	public changeFileHidden(
		name: string,
		hidden: boolean,
		callback: () => void
	) {
		HideFilesPlugin.changeItemHidden(name, hidden, this.getHiddenFiles());
		this.saveAndApplySettings();
		callback();
	}

	public changeFolderHidden(
		name: string,
		hidden: boolean,
		callback: () => void
	) {
		HideFilesPlugin.changeItemHidden(name, hidden, this.getHiddenFolders());
		this.saveAndApplySettings();
		callback();
	}

	private static changeItemHidden(
		name: string,
		hidden: boolean,
		hiddenItems: HiddenItem[]
	) {
		const item = hiddenItems.find((item) => item.name === name);

		if (item) {
			item.hidden = hidden;
		}
	}

	public getHiddenFiles(): HiddenItem[] {
		return this.settings?.hiddenFiles ?? [];
	}

	public getHiddenFolders(): HiddenItem[] {
		return this.settings?.hiddenFolders ?? [];
	}

	public getAllFileNames(): string[] {
		const fileExplorerItems = this.getFileExplorerItems();

		const fileNames: string[] = [];
		for (const key in fileExplorerItems) {
			const item = fileExplorerItems[key];
			if (item.file instanceof TFile) {
				fileNames.push(item.file.name);
			}
		}
		return fileNames;
	}

	public getAllFolderNames(): string[] {
		const fileExplorerItems = this.getFileExplorerItems();
		
		const folderNames: string[] = [];
		for (const key in fileExplorerItems) {
			const item = fileExplorerItems[key];
			if (item.file instanceof TFolder) {
				folderNames.push(item.file.name);
			}
		}
		return folderNames;
	}

	private getFileExplorerItems() {
		// @ts-ignore
		return this.fileExplorerView?.fileItems;
	}
}
