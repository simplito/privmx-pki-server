import "q2-test";

export type Mocked<T> = T&{ [K in keyof T]: T[K] & Mock };

export class TestUtils {
    static createMock<T>(props: {[K in keyof T]?: Mock}) {
        return <Mocked<T>>props;
    }
}