import * as React from 'react';
import { Platform } from 'react-native';
import { Path, Svg, SvgProps } from 'react-native-svg';

interface PencilIconProps extends SvgProps {
    color?: string;
    style?: object;
}

const PencilIcon: React.FC<PencilIconProps> = ({ color = '#F0EBE4', style, ...props }) => {
    const webProps = Platform.OS === 'web' ? { xmlns: "http://www.w3.org/2000/svg" } : {};
    
    return (
        <Svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill={color}
            style={style}
            {...webProps}
            {...props}
        >
            <Path
                d="M13.586 2.45c-.949-.944-2.528-.995-3.483-.048l-1.21 1.21 3.515 3.516 1.21-1.21c.96-.982.918-2.516-.033-3.468zM12.775 5.074l-.367.367-1.828-1.828.367-.367c.487-.482 1.274-.47 1.794.05.52.519.557 1.244.034 1.778zM8.153 4.316L2 10.468l-.32 3.815 3.845-.286 6.154-6.154-3.526-3.527zm0 1.688l1.839 1.839-4.996 4.996-2.008.149.167-1.986 4.998-4.998z"
                fill={color}
            />
        </Svg>
    );
};

export default React.memo(PencilIcon);
