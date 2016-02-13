// Copyright 2016 Keybase Inc. All rights reserved.
// Use of this source code is governed by a BSD
// license that can be found in the LICENSE file.

// +build windows

package libdokan

import (
	"runtime/pprof"

	"github.com/keybase/kbfs/dokan"
	"github.com/keybase/kbfs/libfs"
	"golang.org/x/net/context"
)

// TODO: Also have a file for CPU profiles.

// ProfileList is a node that can list all of the available profiles.
type ProfileList struct {
	emptyFile
}

// GetFileInformation for dokan.
func (ProfileList) GetFileInformation(*dokan.FileInfo) (st *dokan.Stat, err error) {
	return defaultDirectoryInformation()
}

// open tries to open a file.
func (ProfileList) open(ctx context.Context, oc *openContext, path []string) (dokan.File, bool, error) {
	if len(path) == 0 {
		return oc.returnDirNoCleanup(ProfileList{})
	}
	if len(path) > 1 || !libfs.IsSupportedProfileName(path[0]) {
		return nil, false, dokan.ErrObjectNameNotFound
	}
	f := libfs.ProfileGet(path[0])
	if f == nil {
		return nil, false, dokan.ErrObjectNameNotFound
	}
	return &SpecialReadFile{read: f}, false, nil
}

// FindFiles does readdir for dokan.
func (ProfileList) FindFiles(fi *dokan.FileInfo, callback func(*dokan.NamedStat) error) (err error) {
	profiles := pprof.Profiles()
	var ns dokan.NamedStat
	ns.FileAttributes = fileAttributeReadonly
	ns.NumberOfLinks = 1
	for _, p := range profiles {
		ns.Name = p.Name()
		if !libfs.IsSupportedProfileName(ns.Name) {
			continue
		}
		err := callback(&ns)
		if err != nil {
			return err
		}
	}
	return nil
}
