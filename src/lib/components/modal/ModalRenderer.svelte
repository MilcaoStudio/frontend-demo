<script context="module" lang="ts">
    import { ulid } from "ulid";
    import { mount, unmount, type Component } from "svelte";
    import ModifyUsername from "./ModifyUsername.svelte";

    class ModalController {
        stack: ({id: string, instance: Record<string, any>})[] = [];
        private components: Record<string, Component<any>>;
        constructor(components: Record<string, Component<any>>) {
            this.components = components;
        }

        push<ModalProps>(key: string, props: ModalProps) {
            const component = this.components[key];
            console.debug("Mounting", key, "with props", props);
            const instance = mount(component, {
                target: document.body,
                props: {
                    open: true,
                    ...props,
                },
            });
            console.debug(instance);
            this.stack.push({id: ulid(), instance});
        }

        pop() {
            const last = this.stack.pop();
            if (last) {
                console.debug("Unmounting", last.id);
                unmount(last.instance);
            }
        }
    }
    export const modalController = new ModalController({
        ModifyUsername: ModifyUsername,
    });
</script>


<script>
    function keydown(e: KeyboardEvent) {
        if (e.key == "Escape") {
            modalController.pop();
        }
    }
</script>
<svelte:body onkeydown={keydown} />