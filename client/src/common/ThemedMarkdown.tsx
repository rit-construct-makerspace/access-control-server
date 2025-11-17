import { Link } from "@mui/material";
import { ReactElement } from "react";
import ReactMarkdown from "react-markdown";

/**
 * ReactMarkdown wrapper that follows the rest of the websites theme
 * Also makes links open a new tab with noreferrer for security
 * @param props children to pass to ReactMarkdown 
 * @returns ReactElement that ReactMarkdown gives
 */
export default function ThemedMarkdown(props: { children: string, components?: object }): ReactElement {
    return <ReactMarkdown components={{
        a({ children, ...props }) {
            return <Link target="_blank" rel="noopener noreferrer"{...props}>{children}</Link>;
        },
        ...props.components,
    }}
    >{props.children}
    </ReactMarkdown>
}