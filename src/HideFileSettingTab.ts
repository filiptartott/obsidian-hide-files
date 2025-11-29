import {
	App,
	ButtonComponent,
	Notice,
	PluginSettingTab,
	Setting,
	TextComponent,
} from "obsidian";
import HideFilePlugin from "./main";
import { HiddenFile } from "./types";

export default class HideFileSettingTab extends PluginSettingTab {
	plugin: HideFilePlugin;
	listContainer: HTMLDivElement | null = null;
	newItemNameComponent: TextComponent | null = null;
	addButton: ButtonComponent | null = null;
	newItemName = "";

	constructor(app: App, plugin: HideFilePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h3", { text: "Hidden Files" });

		this.listContainer = containerEl.createDiv("hidden-file-list");

		new Setting(containerEl)
			.addText((text) => {
				this.newItemNameComponent = text;
				text.setValue(this.newItemName)
					.setPlaceholder("note.md")
					.onChange((value) => {
						this.onNewItemNameChanged(value);
					});
			})
            .setDesc("Add file:")
			.addButton((button) => {
				this.addButton = button;
				button
					.setButtonText("Add")
					.setDisabled(true)
					.setCta()
					.onClick(async () => {
						await this.onAddItemClick(this.newItemName);
					});
			});

		this.displayList();
	}

	displayList() {
		if (!this.listContainer || !this.plugin.settings) {
			return;
		}

		const listContainer: HTMLDivElement = this.listContainer;
		listContainer.empty();
        
        const allFiles: string[] = this.plugin.getAllFileNames();
        const hiddenFiles = this.plugin.settings.hiddenFiles;

        for (const hiddenFile of hiddenFiles) {
            const matches = allFiles.filter((value) => value === hiddenFile.name);
            matches.length;

            new Setting(listContainer)
				.setName(hiddenFile.name)
				.setDesc(`matches found: ${matches.length}`)
				.addToggle((toggle) => {
					toggle
						.setValue(hiddenFile.hidden)
                        .setTooltip("Hidden")
						.onChange(async (hidden: boolean) => {
							await this.onItemHiddenToggled(hiddenFile, hidden);
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove")
						.onClick(async () => {
							await this.onRemoveItemClick(hiddenFile);
						});
				});
        }
	}

	onNewItemNameChanged(fileName: string) {
		this.newItemName = fileName.trim();
		const isEmpty = this.newItemName.length === 0;
		this.addButton?.setDisabled(isEmpty);
	}

	async saveAndApplySettings() {
		await this.plugin.saveAndApplySettings();
		this.displayList();
	}

	async onItemHiddenToggled(hiddenFile: HiddenFile, hidden: boolean) {
		hiddenFile.hidden = hidden;
		await this.saveAndApplySettings();
	}

	async onRemoveItemClick(hiddenFile: HiddenFile) {
		this.plugin.settings?.hiddenFiles.remove(hiddenFile);
		await this.saveAndApplySettings();
	}

	async onAddItemClick(fileName: string) {
		const newFileName = fileName.contains(".")
			? fileName
			: fileName + ".md";

		const foundHiddenFile = this.plugin.settings?.hiddenFiles.find(
			(hiddenFile) => hiddenFile.name === newFileName
		);
		if (foundHiddenFile) {
			new Notice("This item already exists.");
			return;
		}

		const newHiddenFile: HiddenFile = {
			name: newFileName,
			hidden: true,
		};

		this.plugin.settings?.hiddenFiles.push(newHiddenFile);
		this.newItemNameComponent?.setValue("");
		this.newItemName = "";
		this.addButton?.setDisabled(true);

		await this.saveAndApplySettings();
	}
}
