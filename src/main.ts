import { Plugin, View } from "obsidian";
import HideFileSettingTab from "./HideFileSettingTab";
import { HideFileSettings } from "./types";

const DEFAULT_SETTINGS: HideFileSettings = {
	hiddenFiles: [],
};

export default class HideFilePlugin extends Plugin {
	settings: HideFileSettings | null = null;
	fileExplorerView: View | null = null;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);

		const fileExplorer =
			this.app.workspace.getLeavesOfType("file-explorer")[0];
		this.fileExplorerView = fileExplorer?.view;

		this.addSettingTab(new HideFileSettingTab(this.app, this));

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
		this.app.workspace.onLayoutReady(() => this.updateFileExplorer());
	}

	onunload() {
		this.settings = null;
		this.updateFileExplorer();
	}

	public async saveAndApplySettings() {
		await this.saveData(this.settings);
		this.updateFileExplorer();
	}

	public getAllFileNames(): string[] {
		// @ts-ignore
		const fileItems = this.fileExplorerView?.fileItems;

		const fileNames: string[] = [];
		for (const key in fileItems) {
			const item = fileItems[key];
			if (item.file) {
				fileNames.push(item.file.name);
			}
		}
		return fileNames;
	}

	private updateFileExplorer() {
		// @ts-ignore
		const fileItems = this.fileExplorerView?.fileItems;

		for (const key in fileItems) {
			const item = fileItems[key];

			if (!item.file) {
				continue;
			}

			const entry = this.settings?.hiddenFiles.find(
				(file) => file.name === item.file.name
			);

			item.el.style.display = entry?.hidden ? "none" : "";
		}
	}
}
