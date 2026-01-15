import React, { useCallback, useState, } from 'react';
import useWebSocket from 'react-use-websocket';
import { WebSocketContext, SimpleEventEmitter } from '../../hooks/useWebSocket';
import type { SendMessageParams } from '../../type';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [emitter] = useState(new SimpleEventEmitter());

    const { sendMessage: wsSendMessage } = useWebSocket("ws://192.168.0.155:9090", {
        onMessage: (event) => {
            try {
                const res = JSON.parse(event.data);
                const topic = res.topic || res.service;
                if (topic) {
                    emitter.emit(topic, res);
                }
            } catch (e) {
                console.error('解析消息失败:', e);
            }
        },
        onError: (event) => {
            console.error('WebSocket error:', event);
        },
        onOpen: () => {
            console.log('WebSocket connected');
        },
    });

    const sendMessage = useCallback((msg: SendMessageParams) => {
        wsSendMessage(JSON.stringify(msg));
    }, [wsSendMessage]);

    return (
        <WebSocketContext.Provider value={{ sendMessage, emitter }}>
            {children}
        </WebSocketContext.Provider>
    );
};