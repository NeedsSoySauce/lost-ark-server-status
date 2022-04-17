export type UnsubscribeCallback = () => void;

export class Subscription {
    private unsubscribeCallback: UnsubscribeCallback;

    public constructor(unsubscribeCallback: UnsubscribeCallback) {
        this.unsubscribeCallback = unsubscribeCallback;
    }

    public unsubscribe() {
        this.unsubscribeCallback();
    }
}
