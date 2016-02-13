// Copyright 2015 Keybase Inc. All rights reserved.
// Use of this source code is governed by a BSD
// license that can be found in the LICENSE file.

// +build windows

package libdokan

import (
	"os"
	"path"

	"github.com/keybase/client/go/libkb"
	"github.com/keybase/client/go/logger"
	"github.com/keybase/kbfs/libfs"
	"github.com/keybase/kbfs/libkbfs"
	"golang.org/x/net/context"
)

// StartOptions are options for starting up
type StartOptions struct {
	KbfsParams libkbfs.InitParams
	RuntimeDir string
	Label      string
}

// Start the filesystem
func Start(mounter Mounter, options StartOptions) *libfs.Error {
	var err error

	log := logger.NewWithCallDepth("", 1, os.Stderr)
	log.Info("KBFS version %s", libkbfs.VersionString())

	onInterruptFn := func() {
		mounter.Unmount()
	}

	config, err := libkbfs.Init(options.KbfsParams, onInterruptFn, log)
	if err != nil {
		return libfs.InitError(err.Error())
	}

	defer libkbfs.Shutdown()

	if options.RuntimeDir != "" {
		info := libkb.NewServiceInfo(libkbfs.Version, libkbfs.Build(), options.Label, os.Getpid())
		err = info.WriteFile(path.Join(options.RuntimeDir, "kbfs.info"))
		if err != nil {
			return libfs.InitError(err.Error())
		}
	}

	if options.KbfsParams.Debug {
		// Turn on debugging.  TODO: allow a proper log file and
		// style to be specified.
		log.Configure("", true, "")
	}
	fs, err := NewFS(context.Background(), config, log)
	if err != nil {
		return libfs.InitError(err.Error())
	}
	err = mounter.Mount(fs)
	if err != nil {
		return libfs.MountError(err.Error())
	}

	return nil
}
