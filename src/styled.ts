import styled, { css } from "styled-components";

export const SectionTitle = styled.h2`
    font-size: 1.1rem;
    color: #1e1e1e;
`;

export const Flex = styled.div.attrs<{
    $gap?: 0 | 2 | 4 | 8 | 16 | 32 | 64 | string;
    $direction?: "row" | "column" | string;
    $grow?: number;
}>(props => ({
    $gap: props.$gap || 0,
    $direction: props.$direction || "column",
    $grow: props.$grow,
}))`
    display: flex;
    flex-direction: ${(props) => props.$direction};
    ${(props) => props.$grow && css`
        flex-grow: ${props.$grow};
    `}
    gap: ${(props) => {
        if (typeof props.$gap === "string") {
            return props.$gap;
        } else if (typeof props.$gap === "number") {
            return `${props.$gap * 0.5}rem`;
        }
    }};
`;

export const Container = styled(Flex).attrs<{ $maxWidth?: string; }>(props => ({
    $maxWidth: props.$maxWidth,
}))`
    border: 2px solid #1e1e1e;
    padding: 15px;
    border-radius: 8px;
    max-width: ${(props) => props.$maxWidth};
`;

export const Title = styled.h1.attrs<{
    $bordered?: boolean
}>((props) => ({
    $bordered: props.$bordered || false,
}))`
    font-size: 1.25rem;
    color: #1e1e1e;
    ${props => props.$bordered && css`
        border: 2px solid #1e1e1e;
    `}
    padding: 5px 15px;
    border-radius: 5px;
`;

export const Button = styled.button.attrs<{ $primary?: boolean }>(props => ({
    $primary: props.$primary || false,
}))`
    font-size: 1rem;
    ${props => props.$primary ? css`
        color: #fff;
        background-color: #1e1e1e;
    ` : css`
        color: #1e1e1e;
        background-color: transparent;
    `}
    border: 2px solid #1e1e1e;
    padding: 8px 15px;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    &:hover {
        ${props => props.$primary ? css`
            background-color: #333;
            /* 主操作按钮悬停样式 */
            border-color: #333;
        ` : css`
            background-color: #f0f0f0;
        `}
    }
`

export const LockItem = styled(Button)`
    display: flex;
    flex-direction: column;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
    & > button {
        flex-grow: 1;
    }
`;

export const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
`;

export const ModalContent = styled(Flex)`
    gap: 20px;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid #1e1e1e;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const Input = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    color: #1e1e1e;
    background-color: #fff;
    font-size: 1rem;
`