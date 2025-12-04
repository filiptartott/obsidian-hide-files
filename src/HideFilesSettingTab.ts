import {
	App,
	ButtonComponent,
	PluginSettingTab,
	Setting,
	TextComponent,
	Plugin,
} from "obsidian";
import { HiddenItem } from "./types";
import { HideItems } from "./HideItems";

export default class HideFilesSettingTab extends PluginSettingTab {
	hideItems: HideItems;

	filesListContainer?: HTMLDivElement;
	foldersListContainer?: HTMLDivElement;
	fileNameComponent?: TextComponent;
	folderNameComponent?: TextComponent;
	addFileButton?: ButtonComponent;
	addFolderButton?: ButtonComponent;

	public constructor(app: App, plugin: Plugin, hideItems: HideItems) {
		super(app, plugin);
		this.hideItems = hideItems;
	}

	public display() {
		const container = this.containerEl;
		container.empty();

		container.createEl("h3", { text: "Hidden Files" });
		this.filesListContainer = container.createDiv("hidden-files-list");
		this.displayFilesList();
		this.createAddFileSetting(container);

		container.createEl("h3", { text: "Hidden Folders" });
		this.foldersListContainer = container.createDiv("hidden-folders-list");
		this.displayFoldersList();
		this.createAddFolderSetting(container);
	}

	private displayFilesList() {
		if (!this.filesListContainer) {
			return;
		}

		const allFileNames = this.hideItems.getAllFileNames();

		HideFilesSettingTab.createItemsList(
			this.filesListContainer,
			this.hideItems.getHiddenFiles(),
			allFileNames,
			(name, hidden) => this.onFileHiddenChange(name, hidden),
			(name) => this.onFileRemoveClick(name)
		);
	}

	private displayFoldersList() {
		if (!this.foldersListContainer) {
			return;
		}

		const allFolderNames = this.hideItems.getAllFolderNames();

		HideFilesSettingTab.createItemsList(
			this.foldersListContainer,
			this.hideItems.getHiddenFolders(),
			allFolderNames,
			(name, hidden) => this.onFolderHiddenChange(name, hidden),
			(name) => this.onFolderRemoveClick(name)
		);
	}

	private createAddFileSetting(container: HTMLElement) {
		HideFilesSettingTab.createAddItemSetting(
			container,
			"Add file:",
			"note.md",
			(name) => this.onFileNameChange(name),
			() => this.onAddFileClick(),
			(textComponent) => {
				this.fileNameComponent = textComponent;
			},
			(buttonComponent) => {
				this.addFileButton = buttonComponent;
			}
		);
	}

	private createAddFolderSetting(container: HTMLElement) {
		HideFilesSettingTab.createAddItemSetting(
			container,
			"Add folder:",
			"folder",
			(name) => this.onFolderNameChange(name),
			() => this.onAddFolderClick(),
			(textComponent) => {
				this.folderNameComponent = textComponent;
			},
			(buttonComponent) => {
				this.addFolderButton = buttonComponent;
			}
		);
	}

	private onFileHiddenChange(name: string, hidden: boolean) {
		this.hideItems.changeFileHidden(name, hidden, () => {
			this.displayFilesList();
		});
	}

	private onFolderHiddenChange(name: string, hidden: boolean) {
		this.hideItems.changeFolderHidden(name, hidden, () => {
			this.displayFoldersList();
		});
	}

	private onFileRemoveClick(name: string) {
		this.hideItems.removeFile(name, () => {
			this.displayFilesList();
		});
	}

	private onFolderRemoveClick(name: string) {
		this.hideItems.removeFolder(name, () => {
			this.displayFoldersList();
		});
	}

	private onFileNameChange(name: string) {
		this.addFileButton?.setDisabled(HideFilesSettingTab.isNameEmpty(name));
	}

	private onFolderNameChange(name: string) {
		this.addFolderButton?.setDisabled(HideFilesSettingTab.isNameEmpty(name));
	}

	private onAddFileClick() {
		const name = HideFilesSettingTab.getTextComponentValue(
			this.fileNameComponent
		);

		this.hideItems.addFile(name, () => {
			this.fileNameComponent?.setValue("");
			this.addFileButton?.setDisabled(true);
			this.displayFilesList();
		});
	}

	private onAddFolderClick() {
		const name = HideFilesSettingTab.getTextComponentValue(
			this.folderNameComponent
		);

		this.hideItems.addFolder(name, () => {
			this.folderNameComponent?.setValue("");
			this.addFolderButton?.setDisabled(true);
			this.displayFoldersList();
		});
	}

	private static createAddItemSetting(
		container: HTMLElement,
		description: string,
		placeholder: string,
		onNameChange: (name: string) => void,
		onAddClick: () => void,
		onTextCreated: (textComponent: TextComponent) => void,
		onButtonCreated: (buttonComponent: ButtonComponent) => void
	) {
		new Setting(container)
			.addText((text) => {
				text.setPlaceholder(placeholder).onChange(onNameChange);
				onTextCreated(text);
			})
			.setDesc(description)
			.addButton((button) => {
				button
					.setButtonText("Add")
					.setDisabled(true)
					.setCta()
					.onClick(onAddClick);
				onButtonCreated(button);
			});
	}

	private static createItemsList(
		listContainer: HTMLElement,
		hiddenItems: HiddenItem[],
		allItems: string[],
		onHiddenChange: (name: string, hidden: boolean) => void,
		onItemRemove: (name: string) => void
	) {
		listContainer.empty();

		for (const hiddenItem of hiddenItems) {
			const matches = allItems.filter((name) => name === hiddenItem.name);
			matches.length;

			const setting = new Setting(listContainer)
				.setName(hiddenItem.name)
				.setDesc(`matches found: ${matches.length}`)
				.addToggle((toggle) => {
					toggle
						.setValue(hiddenItem.hidden)
						.setTooltip("Hidden")
						.onChange((hidden: boolean) => {
							onHiddenChange(hiddenItem.name, hidden);
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Remove")
						.onClick(() => {
							onItemRemove(hiddenItem.name);
						});
				});

			if (matches.length === 0) {
				setting.descEl.style.color = "var(--text-error)";       // red
			}
		}
	}

	private static getTextComponentValue(textComponent?: TextComponent) {
		return textComponent?.getValue().trim() ?? "";
	}

	private static isNameEmpty(name: string) {
		return name.trim().length === 0;
	}
}
