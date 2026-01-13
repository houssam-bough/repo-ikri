package com.ikri.app;

import android.app.Application;
import android.webkit.WebView;

public class MyApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Enable WebView debugging for development
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
